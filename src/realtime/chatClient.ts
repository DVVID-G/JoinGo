import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { saveMessage, OutgoingMessage } from '../services/messageService';
import { nanoid } from 'nanoid';

let socket: Socket | null = null;

/**
 * Initialize a connection to an external chat microservice (if configured).
 * The external microservice is expected to expose a Socket.IO server.
 */
export function initChatClient() {
  const url = config.chatServiceUrl;
  if (!url) {
    logger.info('No external CHAT_SERVICE_URL configured, skipping chat client initialization');
    return null;
  }

  if (socket) return socket;

  const token = config.chatServiceToken;
  const opts: any = { transports: ['websocket'], reconnection: true };
  if (token) {
    // Masked log to avoid printing secret
    const masked = token.length > 8 ? `${token.slice(0,4)}...${token.slice(-4)}` : '****';
    logger.info('Chat client will send service token (masked)=', masked);
    opts.auth = { token };
  } else {
    logger.info('Chat client has no CHAT_SERVICE_TOKEN configured');
  }

  logger.info('Connecting to external chat microservice at', url);
  socket = io(url, opts);

  socket.on('connect', () => logger.info('Connected to external chat service, socket id=', socket?.id));
  socket.on('connect_error', (err: any) => {
    logger.warn('Chat client connect_error', err?.message ?? err);
    // Provide actionable hints for the common 'unauthorized' error
    if (err && String(err.message || err).toLowerCase().includes('unauthorized')) {
      logger.warn('Connection to eisc-chat was rejected (unauthorized).');
      logger.warn('Possible fixes:');
      logger.warn('- Ensure the environment variable CHAT_SERVICE_TOKEN is set in both the backend and the eisc-chat service and that they match.');
      logger.warn("  Example: add 'CHAT_SERVICE_TOKEN=your-secret' to both .env files.");
      logger.warn('- Or configure a valid Firebase ID token on the client-side connections and ensure eisc-chat has Firebase Admin credentials to verify tokens.');
      logger.warn('- If you intentionally want unauthenticated connections, update eisc-chat middleware to allow anonymous (not recommended for production).');
    }
  });
  socket.on('disconnect', (reason: any) => logger.info('Chat client disconnected', reason));

  // Example forwarding: when external service emits a room event, log it.
  socket.on('room:event', (data: unknown) => logger.info('room:event received from chat service', data));
  
  // Persist incoming chat messages to Firestore (backend is responsible for persistence)
  socket.on('chat:message', (payload: any) => {
    try {
      const meetingId: string | undefined = payload?.meetingId;
      const idFromClient: string | undefined = payload?.messageId || payload?.id;
      const senderUid: string = payload?.userId || payload?.senderUid || (socket?.id ?? 'unknown');
      const userName: string | undefined = payload?.userName || payload?.displayName;
      const text: string = String(payload?.message || payload?.text || '').trim();
      const createdAt: string = payload?.timestamp || payload?.createdAt || new Date().toISOString();
      if (!meetingId) {
        logger.warn('Received chat:message without meetingId; skipping persistence');
        return;
      }
      if (!text) {
        logger.warn('Received empty chat:message; skipping persistence');
        return;
      }
      const msgId = idFromClient || nanoid();
      const msg: OutgoingMessage = { id: msgId, meetingId, senderUid, text, createdAt, userName } as OutgoingMessage;
      saveMessage(meetingId, msg).catch(err => logger.error('Failed to persist message from chat service', err));
    } catch (err) {
      logger.error('Error handling incoming chat:message', err);
    }
  });

  return socket;
}

export function getChatClient() {
  return socket;
}
