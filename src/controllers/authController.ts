import { Request, Response } from 'express';
import { registerUser, generatePasswordResetLink, revokeRefreshTokens, loginWithEmailPassword } from '../services/authService';
import { validate } from '../utils/validate';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { registerSchema, forgotSchema, loginSchema, changeEmailSchema, changePasswordSchema } from './schemas/authSchemas';
import { providerSyncSchema } from './schemas/authSchemas';
import { firebaseAuth } from '../config/firebase';
import { createOrSyncUserFromProvider } from '../services/userService';
import { oauthSchema } from './schemas/authSchemas';
import { exchangeCodeForProfile } from '../services/oauthService';
import { upsertProfileFromProvider } from '../services/userService';
import { logger } from '../utils/logger';

/**
 * Register endpoint (creates Firebase Auth user and Firestore profile).
 */
export async function registerController(req: Request, res: Response) {
  const data = validate(registerSchema, req.body);
  const result = await registerUser(data);
  res.status(201).json({ data: result });
}

/**
 * Generate a password reset link for the given email and return it.
 */
export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = validate(forgotSchema, req.body);
  const link = await generatePasswordResetLink(email);
  res.json({ data: { link } });
}

/**
 * Login with email and password. Returns auth tokens from Firebase.
 */
export async function loginController(req: Request, res: Response) {
  const { email, password } = validate(loginSchema, req.body);
  const result = await loginWithEmailPassword(email, password);
  res.json({ data: result });
}

/**
 * Change authenticated user's email.
 */
export async function changeEmailController(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  const { email } = validate(changeEmailSchema, req.body);
  // Update in Auth
  const { updateUserEmail } = await import('../services/authService');
  await updateUserEmail(uid, email);
  res.json({ data: { success: true } });
}

/**
 * Change authenticated user's password.
 */
export async function changePasswordController(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  const { password } = validate(changePasswordSchema, req.body);
  const { updateUserPassword } = await import('../services/authService');
  await updateUserPassword(uid, password);
  res.json({ data: { success: true } });
}

/**
 * Logout (server-side) — revoke refresh tokens for the authenticated user.
 */
export async function logoutController(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  await revokeRefreshTokens(uid);
  res.json({ data: { success: true } });
}

/**
 * Synchronize profile from an external provider. The endpoint is protected
 * and will use the authenticated uid to fetch provider data from Firebase
 * and merge it into the Firestore `users/{uid}` document.
 */
export async function providerSyncController(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  // optional supplemental payload from client
  const supplemental = validate(providerSyncSchema, req.body);

  const auth = firebaseAuth();
  if (!auth) throw new Error('Auth not initialized');
  const userRecord = await auth.getUser(uid);

  const providerEntry = (userRecord.providerData && userRecord.providerData[0]) || undefined;

  const providerData = {
    displayName: userRecord.displayName || supplemental.displayName,
    firstName: supplemental.firstName,
    lastName: supplemental.lastName,
    email: userRecord.email || supplemental.email,
    avatarUrl: userRecord.photoURL || supplemental.avatarUrl,
    phoneNumber: userRecord.phoneNumber || supplemental.phoneNumber,
    locale: (userRecord as any).locale || supplemental.locale,
    provider: providerEntry ? providerEntry.providerId : supplemental.provider,
    providerUid: providerEntry ? (providerEntry.uid as string) : undefined,
    providerId: providerEntry ? (providerEntry.providerId as string) : undefined
  };

  const result = await createOrSyncUserFromProvider(uid, providerData as any);
  res.json({ data: result });
}

/**
 * Server-side OAuth endpoint. Exchanges `code` for profile info, creates or
 * links a Firebase Auth user, upserts the Firestore profile, and returns a
 * Firebase custom token that the client can exchange via `signInWithCustomToken`.
 */
export async function oauthController(req: Request, res: Response) {
  const { provider, code, redirectUri } = validate(oauthSchema, req.body);
  // Exchange code for normalized profile
  const profile = await exchangeCodeForProfile(provider, code, redirectUri);

  const auth = firebaseAuth();
  if (!auth) throw new Error('Auth not initialized');

  // Try to find existing user by email
  let uid: string | undefined;
  if (profile.email) {
    try {
      const existing = await auth.getUserByEmail(profile.email);
      uid = existing.uid;
    } catch (e) {
      // Not found -> will create
    }
  }

  // If no UID yet, construct deterministic uid based on provider
  if (!uid) {
    uid = `provider_${provider}_${profile.providerUid || Math.random().toString(36).slice(2,10)}`;
    // Try to create user in Firebase Auth (ignore if already exists)
    try {
      await auth.createUser({ uid, email: profile.email, displayName: profile.displayName, photoURL: profile.avatarUrl });
      logger.info('Created auth user for oauth uid', uid);
    } catch (e) {
      // If creation fails because user exists, ignore and continue
      logger.warn('Could not create auth user during oauth flow', e);
    }
  }

  // Upsert Firestore profile using provider-aware upsert (preserve completed profiles)
  const user = await upsertProfileFromProvider(uid, {
    provider: profile.provider,
    providerUid: profile.providerUid,
    displayName: profile.displayName,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    locale: profile.locale
  } as any);

  // Create Firebase custom token for client to sign in
  const customToken = await auth.createCustomToken(uid);

  res.json({ data: { customToken, user } });
}
