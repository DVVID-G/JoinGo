import { firebaseAuth } from '../config/firebase';
import { Errors } from '../utils/httpErrors';
import { syncUser } from './userService';
import { getEnv } from '../config/env';

interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
}

/**
 * Register a new user in Firebase Auth and create a minimal profile in Firestore.
 * @param input Register payload
 */
export async function registerUser(input: RegisterInput) {
  const auth = firebaseAuth();
  if (!auth) throw Errors.server('Auth service unavailable');

  // Create user in Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName
    });
  } catch (e) {
    // Log Firebase error details for debugging and map common Firebase errors
    // to clearer HTTP errors for the client.
    // eslint-disable-next-line no-console
    console.error('Firebase createUser error:', e);
    const errAny: any = e;
    const code = errAny?.errorInfo?.code || errAny?.code;
    if (code === 'auth/configuration-not-found') {
      // Common when the Auth provider (e.g., Email/Password) is not configured
      throw Errors.badRequest('Authentication provider configuration not found. Check Firebase Console -> Authentication -> Sign-in method and enable Email/Password.');
    }
    if (code === 'auth/email-already-exists') {
      throw Errors.conflict('Email already exists');
    }
    // Fallback
    throw Errors.server('Failed to create auth user');
  }

  // Create minimal profile in Firestore via userService
  const profile = {
    displayName: input.displayName || `${input.firstName || ''} ${input.lastName || ''}`.trim(),
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    age: input.age,
    role: 'participant'
  } as any;

  await syncUser(userRecord.uid, profile);
  return { uid: userRecord.uid, email: userRecord.email, displayName: userRecord.displayName };
}

// NOTE: password reset is handled client-side via Firebase Auth SDK.
// Server-side generation of password reset links was intentionally removed
// in favor of the client-side `sendPasswordResetEmail` flow. If you need
// to re-introduce server-side link generation later, implement
// `admin.auth().generatePasswordResetLink(email, actionCodeSettings)` here.

/**
 * Revoke refresh tokens for a user (server-side logout effect).
 */
export async function revokeRefreshTokens(uid: string) {
  const auth = firebaseAuth();
  if (!auth) throw Errors.server('Auth service unavailable');
  await auth.revokeRefreshTokens(uid);
  return true;
}

/**
 * Sign in using email and password via Firebase Auth REST API.
 * Returns the idToken and related auth data on success.
 * Note: requires `FIREBASE_API_KEY` environment variable to be set.
 */
export async function loginWithEmailPassword(email: string, password: string) {
  const apiKey = getEnv('FIREBASE_API_KEY');
  if (!apiKey) throw Errors.server('Missing FIREBASE_API_KEY for login');

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const message = body.error?.message || 'Authentication failed';
    // Return a generic unauthorized HttpError (message logged for debugging)
    // Avoid passing a string to Errors.unauthorized which expects no args.
    // Keep diagnostic available via console for developer troubleshooting.
    // eslint-disable-next-line no-console
    console.error('loginWithEmailPassword failed:', message);
    throw Errors.unauthorized();
  }

  const data = await resp.json();
  // data contains idToken, refreshToken, expiresIn, localId (uid), email, displayName
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    uid: data.localId,
    email: data.email,
    displayName: data.displayName
  };
}

/**
 * Update a user's email in Firebase Auth and optionally in Firestore profile via userService.
 * @param uid Firebase UID
 * @param newEmail New email address
 */
export async function updateUserEmail(uid: string, newEmail: string) {
  const auth = firebaseAuth();
  if (!auth) throw Errors.server('Auth service unavailable');
  try {
    await auth.updateUser(uid, { email: newEmail });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('updateUserEmail error:', e);
    const errAny: any = e;
    if (errAny?.errorInfo?.code === 'auth/email-already-exists') {
      throw Errors.conflict('Email already exists');
    }
    throw Errors.server('Failed to update email');
  }
}

/**
 * Update a user's password in Firebase Auth.
 * @param uid Firebase UID
 * @param newPassword New password (min length validated upstream)
 */
export async function updateUserPassword(uid: string, newPassword: string) {
  const auth = firebaseAuth();
  if (!auth) throw Errors.server('Auth service unavailable');
  try {
    await auth.updateUser(uid, { password: newPassword });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('updateUserPassword error:', e);
    throw Errors.server('Failed to update password');
  }
}

/**
 * Delete a user account. If `full` is true, remove from Firebase Auth and mark Firestore doc deleted;
 * otherwise perform a soft-delete on the Firestore user doc.
 */
export async function deleteUserAccount(uid: string, full = false) {
  const auth = firebaseAuth();
  try {
    if (full) {
      if (!auth) throw Errors.server('Auth service unavailable');
      await auth.deleteUser(uid);
    }
    // Firestore update delegated to userService.softDeleteUser from controller
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('deleteUserAccount error:', e);
    throw Errors.server('Failed to delete user account');
  }
}
