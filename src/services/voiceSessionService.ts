import { createHmac } from 'crypto';
import { config } from '../config/env';
import { getMeeting } from './meetingService';
import { Errors } from '../utils/httpErrors';
import { IceServerConfig, VoiceConfig, VoiceSession } from '../models/voice';

const VOICE_TOKEN_TTL_MS = 5 * 60 * 1000;
const DEFAULT_ICE: IceServerConfig[] = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Build ICE servers array based on env configuration with a secure fallback.
 */
function resolveIceServers(): IceServerConfig[] {
  if (!config.iceServerUrl) return DEFAULT_ICE;
  const server: IceServerConfig = { urls: config.iceServerUrl };
  if (config.iceServerUsername) server.username = config.iceServerUsername;
  if (config.iceServerCredential) server.credential = config.iceServerCredential;
  return [server];
}

/**
 * Returns shared voice configuration for clients.
 */
export function getVoiceConfig(): VoiceConfig {
  return {
    voiceServerUrl: config.voiceServiceUrl || null,
    signalUrl: config.webRtcSignalUrl || config.voiceServiceUrl || null,
    iceServers: resolveIceServers(),
    requiresToken: Boolean(config.voiceServiceToken)
  };
}

/**
 * Creates a short-lived voice session, ensuring the meeting is active and voice-enabled.
 */
export async function createVoiceSession(meetingId: string, userId: string): Promise<VoiceSession> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw Errors.notFound('Meeting not found');
  if (meeting.status && meeting.status !== 'active') throw Errors.conflict('Meeting is not active');
  if (meeting.voiceEnabled === false) throw Errors.conflict('Voice chat disabled for this meeting');

  const voiceServerUrl = config.voiceServiceUrl;
  if (!voiceServerUrl) throw Errors.server('Voice service unavailable');

  const snapshot = getVoiceConfig();
  if (!snapshot.voiceServerUrl) throw Errors.server('Voice signaling URL not configured');

  const voiceRoomId = meeting.voiceRoomId || meeting.id;
  const expiresAt = new Date(Date.now() + VOICE_TOKEN_TTL_MS).toISOString();
  const token = signVoiceToken({ meetingId, voiceRoomId, userId, exp: expiresAt });

  return {
    meetingId,
    voiceRoomId,
    userId,
    voiceServerUrl: snapshot.voiceServerUrl,
    signalUrl: snapshot.signalUrl,
    iceServers: snapshot.iceServers,
    token,
    expiresAt
  };
}

function signVoiceToken(payload: Record<string, unknown>): string | undefined {
  if (!config.voiceServiceToken) return undefined;
  const serialized = JSON.stringify(payload);
  const signature = createHmac('sha256', config.voiceServiceToken).update(serialized).digest('hex');
  return Buffer.from(`${serialized}.${signature}`).toString('base64url');
}
