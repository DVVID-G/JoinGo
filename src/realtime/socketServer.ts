// This file previously contained a Socket.IO server implementation.
// Per project architecture the dedicated microservice `eisc-chat`
// now hosts the real-time server and the backend should act as a client
// that persists messages to Firestore. Keep a small stub here so
// imports remain safe if any module still references it accidentally.

export function initSocketServer() {
  // no-op: Socket server moved to `eisc-chat` microservice
  return null;
}
