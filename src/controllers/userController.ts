import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { syncUser, getUser, updateUser, softDeleteUser } from '../services/userService';
import { deleteUserAccount } from '../services/authService';
import { validate } from '../utils/validate';
import { syncUserSchema, updateUserSchema } from './schemas/userSchemas';
import { logger } from '../utils/logger';

/**
 * Upsert user profile for the authenticated user.
 * Validates input and delegates to service layer.
 * @param req AuthenticatedRequest with `req.user.uid`
 * @param res Express response
 */
export async function syncUserProfile(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  const data = validate(syncUserSchema, req.body);
  // Log whether client supplied a phoneNumber (do not log raw value)
  logger.info(`User ${uid} sync payload includes phoneNumber: ${data.phoneNumber ? 'yes' : 'no'}`);
  const user = await syncUser(uid, data);
  res.json({ data: user });
}

/**
 * Return profile of the currently authenticated user.
 * @param req AuthenticatedRequest with `req.user.uid`
 * @param res Express response
 */
export async function getMe(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  const user = await getUser(uid);
  res.json({ data: user });
}

/**
 * Update editable profile fields for the authenticated user.
 * Validates input and returns updated user object.
 * @param req AuthenticatedRequest with `req.user.uid`
 * @param res Express response
 */
export async function updateMe(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  const data = validate(updateUserSchema, req.body);
  // Log presence of phoneNumber for debugging (mask actual value)
  logger.info(`User ${uid} update payload includes phoneNumber: ${data.phoneNumber ? 'yes' : 'no'}`);
  const user = await updateUser(uid, data);
  res.json({ data: user });
}

/**
 * Soft delete the authenticated user's account (mark as deleted in Firestore).
 * @param req AuthenticatedRequest with `req.user.uid`
 * @param res Express response
 */
export async function deleteMe(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?.uid as string;
  // If query param full=true supplied, also delete from Firebase Auth
  const full = String(req.query.full || 'false') === 'true';
  if (full) {
    await deleteUserAccount(uid, true);
  }
  const user = await softDeleteUser(uid);
  res.json({ data: user });
}
