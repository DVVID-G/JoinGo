import { firebaseDb } from '../config/firebase';
import { User } from '../models/user';
import { Errors } from '../utils/httpErrors';
import { logger } from '../utils/logger';

const COLLECTION = 'users';

function now(): string {
  return new Date().toISOString();
}

/**
 * Upsert a user document using the Firebase UID as document id.
 * If the document does not exist it will be created with `createdAt` and `updatedAt`.
 * If it exists, fields provided in `partial` are merged and `updatedAt` is refreshed.
 * @param uid Firebase user id
 * @param partial Partial user fields to upsert
 * @returns The upserted User object
 */
export async function syncUser(uid: string, partial: Partial<User>): Promise<User> {
  // Delegates to the generic upsertUser where incoming fields override existing data
  return upsertUser(uid, partial, { incomingWins: true, preserveCompleted: false });
}

/**
 * Create or update a user profile using data coming from an external provider
 * (Google, Facebook, etc.). This method will try to persist all available
 * provider fields and will not overwrite user-customized fields when
 * `profileCompleted === true`.
 * @param uid Firebase uid
 * @param providerData Partial set of fields extracted from provider or client
 * @returns The upserted User
 */
export async function createOrSyncUserFromProvider(uid: string, providerData: Partial<User>): Promise<User> {
  // Use the standardized upsert for provider data: prefer existing user fields
  const result = await upsertProfileFromProvider(uid, providerData);
  logger.info('Synced user from provider', uid, providerData.provider);
  return result;
}

/** Fetch current user profile */
/**
 * Retrieve a user document by UID.
 * Throws a `NotFound` HttpError if the user does not exist.
 * @param uid Firebase user id
 * @returns The User object
 */
export async function getUser(uid: string): Promise<User> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const ref = db.collection(COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw Errors.notFound('User not found');
  return snap.data() as User;
}

/**
 * Pure helper merging current user data with incoming partial data.
 * @param current Existing user or undefined
 * @param incoming Incoming partial data
 * @param opts Options to control merge behavior
 */
export function mergeProfile(current: User | undefined, incoming: Partial<User>, opts?: { incomingWins?: boolean; preserveCompleted?: boolean }): User {
  const incomingWins = opts?.incomingWins ?? true;
  const preserveCompleted = opts?.preserveCompleted ?? false;
  const timestamp = now();

  const base: User = current
    ? { ...current }
    : ({ uid: incoming.uid || '', createdAt: timestamp, updatedAt: timestamp, status: 'active' } as User);

  const writeField = (key: keyof User) => {
    const incomingVal = incoming[key];
    if (incomingVal === undefined) return;
    // If preserving completed profiles, skip updating personal fields when profileCompleted===true
    if (preserveCompleted && current && current.profileCompleted && ['displayName', 'firstName', 'lastName', 'email', 'avatarUrl', 'phoneNumber', 'locale'].includes(key as string)) {
      return;
    }
    if (incomingWins) {
      (base as any)[key] = incomingVal;
    } else {
      (base as any)[key] = (base as any)[key] || incomingVal;
    }
  };

  // Personal/profile fields
  writeField('displayName');
  writeField('firstName');
  writeField('lastName');
  writeField('email');
  writeField('avatarUrl');
  writeField('phoneNumber');
  writeField('locale');
  writeField('role');

  // Provider metadata - always merge (prefer incoming if provided)
  if (incoming.provider) base.provider = incoming.provider;
  if (incoming.providerUid) base.providerUid = incoming.providerUid;
  if (incoming.providerId) base.providerId = incoming.providerId;

  base.updatedAt = timestamp;
  // Recompute profileCompleted if possible
  base.profileCompleted = Boolean(base.profileCompleted || (base.firstName && base.lastName && base.email));
  return base;
}

/**
 * Upsert a user document using Firestore transaction to avoid race conditions.
 * Options control merge behavior: whether incoming fields overwrite existing ones
 * and whether to preserve completed profiles when merging provider data.
 */
export async function upsertUser(uid: string, incoming: Partial<User>, opts?: { incomingWins?: boolean; preserveCompleted?: boolean }): Promise<User> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const ref = db.collection(COLLECTION).doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data() as User) : undefined;
    const merged = mergeProfile(current, incoming, opts);
    merged.uid = uid;
    if (!snap.exists) merged.createdAt = now();
    merged.updatedAt = now();
    tx.set(ref, merged, { merge: true });
    return merged;
  });
  return result as User;
}

/**
 * Convenience wrapper for provider-origin data; provider merges should not overwrite
 * user-completed fields and prefer preserving existing profile when possible.
 */
export async function upsertProfileFromProvider(uid: string, providerData: Partial<User>): Promise<User> {
  // For provider data, do not allow incoming provider fields to overwrite a completed profile
  return upsertUser(uid, providerData, { incomingWins: false, preserveCompleted: true });
}

/** Update editable fields */
/**
 * Update editable fields of a user document and refresh `updatedAt`.
 * Throws NotFound if the user does not exist.
 * @param uid Firebase user id
 * @param partial Partial fields to update
 * @returns The updated User object
 */
export async function updateUser(uid: string, partial: Partial<User>): Promise<User> {
  // Enforce existence for updateUser to preserve previous semantics (throw if not exists)
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const ref = db.collection(COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw Errors.notFound('User not found');
  // For explicit user updates, incoming should overwrite existing fields
  return upsertUser(uid, partial, { incomingWins: true, preserveCompleted: false });
}

/** Soft delete user */
/**
 * Soft delete a user by setting `status: 'deleted'`, `deletedAt` and updating `updatedAt`.
 * @param uid Firebase user id
 * @returns The user object after the soft-delete update
 */
export async function softDeleteUser(uid: string): Promise<User> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const ref = db.collection(COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw Errors.notFound('User not found');
  const current = snap.data() as User;
  const updated: User = {
    ...current,
    status: 'deleted',
    deletedAt: now(),
    updatedAt: now()
  };
  await ref.set(updated, { merge: true });
  return updated;
}
