import { firebaseDb } from '../config/firebase';
import { Meeting } from '../models/meeting';
import { nanoid } from 'nanoid';
import { Errors } from '../utils/httpErrors';

const COLLECTION = 'meetings';

/**
 * Update the meeting's status (soft-delete or restore) and set audit fields.
 * Only the meeting host should be allowed to change status; callers should pass hostUid for authorization.
 */
export async function updateMeetingStatus(meetingId: string, hostUid: string, status: 'active' | 'inactive' | 'closed') {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const ref = db.collection(COLLECTION).doc(meetingId);
  const snap = await ref.get();
  if (!snap.exists) throw Errors.notFound('Meeting not found');
  const existing = snap.data() as any;
  if (existing.hostUid !== hostUid) throw Errors.forbidden();

  const now = new Date().toISOString();
  const updatePayload: any = { status, updatedAt: now };
  if (status === 'inactive') updatePayload.deletedAt = now;

  await ref.set(updatePayload, { merge: true });
  const updatedSnap = await ref.get();
  return updatedSnap.data() as any;
}

/**
 * Create a meeting document in Firestore.
 */
export async function createMeeting(hostUid: string, opts?: { maxParticipants?: number; ttlMinutes?: number; metadata?: any }): Promise<Meeting> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const id = nanoid(10);
  const now = new Date().toISOString();
  const meeting: Meeting = {
    id,
    hostUid,
    createdAt: now,
    status: 'active',
    maxParticipants: opts?.maxParticipants || 10,
    metadata: opts?.metadata,
    voiceEnabled: true,
    voiceRoomId: id
  };
  if (opts?.ttlMinutes) {
    meeting.expiresAt = new Date(Date.now() + opts.ttlMinutes * 60000).toISOString();
  }
  await db.collection(COLLECTION).doc(id).set(meeting);
  return meeting;
}

/**
 * Get a meeting by id
 */
export async function getMeeting(id: string): Promise<Meeting | null> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as Meeting;
}

/**
 * List meetings for a given host (only active meetings).
 */
export async function listMeetingsByHost(hostUid: string): Promise<Meeting[]> {
  const db = firebaseDb();
  if (!db) throw Errors.server('Firestore unavailable');
  try {
    const q = await db
      .collection(COLLECTION)
      .where('hostUid', '==', hostUid)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();
    const meetings: Meeting[] = [];
    q.forEach((doc) => {
      meetings.push(doc.data() as Meeting);
    });
    return meetings;
  } catch (err: any) {
    // Firestore may require a composite index for this query. Fall back to a simpler query
    // and filter/sort in memory. Also log link to create index if Firestore provided it.
    try {
      const msg = err && err.message ? err.message : String(err);
      console.warn('meetingService.listMeetingsByHost: primary query failed:', msg);
      // If Firestore provided an index creation URL include it in the logs
      if (msg && msg.includes('The query requires an index')) {
          const match = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        if (match && match[0]) console.warn('Create composite index:', match[0]);
      }
    } catch (e) {
      // ignore logging errors
    }

    // Fallback: query by hostUid only, then filter status and sort client-side.
    const snap = await db.collection(COLLECTION).where('hostUid', '==', hostUid).get();
    const meetings: Meeting[] = [];
    snap.forEach((doc) => {
      const m = doc.data() as Meeting;
      if (m.status === 'active') meetings.push(m);
    });
    // sort by createdAt desc
    meetings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return meetings;
  }
}
