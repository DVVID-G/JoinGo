import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let voiceSocket: Socket | null = null;

/**
 * Initializes a background connection to the Voice-video-server microservice for health checks/logging.
 */
export function initVoiceClient() {
  const url = config.voiceServiceUrl;
  if (!url) {
    logger.info('No VOICE_SERVICE_URL configured; skipping voice client initialization');
    return null;
  }
  if (voiceSocket) return voiceSocket;

  const opts: any = { transports: ['websocket'], reconnection: true };
  if (config.voiceServiceToken) {
    const token = config.voiceServiceToken;
    const masked = token.length > 6 ? `${token.slice(0, 3)}...${token.slice(-3)}` : '***';
    logger.info('Voice client sending auth token (masked):', masked);
    opts.auth = { token };
  }

  logger.info('Connecting to voice signaling service at', url);
  voiceSocket = io(url, opts);

  voiceSocket.on('connect', () => logger.info('Voice client connected', { socketId: voiceSocket?.id }));
  voiceSocket.on('disconnect', (reason) => logger.info('Voice client disconnected', reason));
  voiceSocket.on('connect_error', (error) => logger.warn('Voice client connect_error', error instanceof Error ? error.message : error));
  voiceSocket.on('introduction', (peers) => logger.info('Voice service introduction event', Array.isArray(peers) ? peers.length : peers));
  voiceSocket.on('newUserConnected', (peerId) => logger.info('Voice service new user connected', peerId));
  voiceSocket.on('userDisconnected', (peerId) => logger.info('Voice service user disconnected', peerId));

  return voiceSocket;
}

export function getVoiceClient() {
  return voiceSocket;
}
