import { Request, Response } from 'express';
import { createMeeting, getMeeting, listMeetingsByHost, updateMeetingStatus } from '../services/meetingService';
import { firebaseDb } from '../config/firebase';
import { getRecentMessages } from '../services/messageService';
import { getEnv } from '../config/env';
import { validate } from '../utils/validate';
import { z } from 'zod';

const createSchema = z.object({ maxParticipants: z.number().int().min(2).max(10).optional(), ttlMinutes: z.number().int().optional(), metadata: z.record(z.any()).optional() });

/**
 * Create meeting
 */
export async function createMeetingController(req: Request, res: Response) {
  const uid = (req as any).user?.uid as string;
  const data = validate(createSchema, req.body);
  const meeting = await createMeeting(uid, { maxParticipants: data.maxParticipants, ttlMinutes: data.ttlMinutes, metadata: data.metadata });
  res.status(201).json({ data: meeting });
}

export async function getMeetingController(req: Request, res: Response) {
  const id = req.params.id;
  const meeting = await getMeeting(id);
  if (!meeting) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found' } });
  res.json({ data: meeting });
}

/**
 * Get recent persisted messages for a meeting.
 * Protected: requires a valid Firebase ID token in Authorization header (handled by `authMiddleware`).
 */
export async function getMeetingMessagesController(req: Request, res: Response) {
  const meetingId = req.params.id as string;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const messages = await getRecentMessages(meetingId, Number.isFinite(limit) ? limit : 50);
  // Map persisted message shape to frontend ChatMessagePayload
  const mapped = messages.map((m: any) => ({
    messageId: m.id,
    meetingId: m.meetingId,
    userId: m.senderUid,
    userName: m.userName,
    message: m.text,
    timestamp: m.createdAt,
  }));
  res.json(mapped);
}

/**
 * Return active meetings for the authenticated host.
 */
export async function getMyMeetingsController(req: Request, res: Response) {
  const uid = (req as any).user?.uid as string;
  if (!uid) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  try {
    const meetings = await listMeetingsByHost(uid);
    return res.json({ data: meetings });
  } catch (err: any) {
    // Primary query failed (often due to Firestore composite index requirement).
    // Attempt a safe fallback: simple hostUid query + in-memory filter/sort.
    try {
      console.warn('getMyMeetingsController: primary list failed, running fallback. Error:', err && err.message ? err.message : err);
      const db = firebaseDb();
      if (!db) throw new Error('Firestore unavailable');
      const snap = await db.collection('meetings').where('hostUid', '==', uid).get();
      const meetings: any[] = [];
      snap.forEach((doc) => {
        const m = doc.data();
        if (m.status === 'active') meetings.push(m);
      });
      meetings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return res.json({ data: meetings });
    } catch (err2) {
      console.error('getMyMeetingsController fallback failed:', err2);
      return res.status(500).json({ error: { code: 'UNEXPECTED', message: 'Unexpected error' } });
    }
  }
}

/**
 * Update meeting status (soft-delete / restore).
 * Protected: only host may update status.
 */
export async function updateMeetingStatusController(req: Request, res: Response) {
  const uid = (req as any).user?.uid as string;
  if (!uid) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  const id = req.params.id as string;
  const bodySchema = z.object({ status: z.enum(['active', 'inactive', 'closed']) });
  const data = validate(bodySchema, req.body);
  try {
    const updated = await updateMeetingStatus(id, uid, data.status as any);
    return res.json({ data: updated });
  } catch (err: any) {
    if (err instanceof Error && (err as any).status) {
      return res.status((err as any).status).json({ error: { code: (err as any).code || 'ERROR', message: err.message } });
    }
    console.error('updateMeetingStatusController error', err);
    return res.status(500).json({ error: { code: 'UNEXPECTED', message: 'Unexpected error' } });
  }
}
