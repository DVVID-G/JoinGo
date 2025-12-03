/**
 * ICE server descriptor used by WebRTC peers.
 */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Shared configuration returned to clients that need to bootstrap Peer.js.
 */
export interface VoiceConfig {
  voiceServerUrl: string | null;
  signalUrl: string | null;
  iceServers: IceServerConfig[];
  requiresToken: boolean;
}

/**
 * Voice session issued to authenticated users so they can connect to the signaling layer.
 */
export interface VoiceSession {
  meetingId: string;
  voiceRoomId: string;
  userId: string;
  voiceServerUrl: string;
  signalUrl: string | null;
  iceServers: IceServerConfig[];
  token?: string;
  expiresAt: string;
}
