import { Request, Response } from 'express';
import { registerUser, revokeRefreshTokens, loginWithEmailPassword } from '../services/authService';
import { validate } from '../utils/validate';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { registerSchema, forgotSchema, loginSchema, changeEmailSchema, changePasswordSchema } from './schemas/authSchemas';
import { providerSyncSchema } from './schemas/authSchemas';
import { firebaseAuth } from '../config/firebase';
import { createOrSyncUserFromProvider } from '../services/userService';
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
 * Forgot password (client-side recommended).
 *
 * This endpoint intentionally does not generate or return password reset links.
 * Recommended flow: the frontend should call Firebase client SDK `sendPasswordResetEmail(email)`
 * which lets Firebase send the reset email using the project's configured templates.
 *
 * For compatibility, the backend accepts `{ email }` and returns a neutral response
 * so callers can use the same API shape without revealing account existence.
 */
export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = validate(forgotSchema, req.body);
  // Optionally log the attempt for monitoring (do not disclose existence).
  logger.info('Password reset requested for email (redacted): %s', email ? '[REDACTED]' : '');

  // Always return a neutral, non-revealing message.
  return res.json({ data: { message: 'If an account exists for that email, a password reset link will be sent.' } });
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

// Server-side OAuth controller removed. Use client-side Firebase Authentication
// and the protected `POST /api/auth/provider-sync` endpoint to sync provider
// profiles into Firestore.
