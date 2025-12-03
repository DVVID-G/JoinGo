import { Request, Response } from 'express';
import { z } from 'zod';
import { createVoiceSession, getVoiceConfig } from '../services/voiceSessionService';
import { validate } from '../utils/validate';

const voiceSessionSchema = z.object({ meetingId: z.string().min(4, 'Meeting ID is required') });

/**
 * Returns configuration data (signaling URL + ICE servers) for the voice microservice.
 */
export async function getVoiceConfigController(_req: Request, res: Response) {
  const config = getVoiceConfig();
  return res.json({ data: config });
}

/**
 * Issues a short-lived voice session token so authenticated clients can join the voice microservice.
 */
export async function createVoiceSessionController(req: Request, res: Response) {
  const uid = (req as any).user?.uid as string;
  if (!uid) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  const payload = validate(voiceSessionSchema, req.body);
  const session = await createVoiceSession(payload.meetingId, uid);
  return res.json({ data: session });
}
