import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns a required environment variable or throws an error when missing in production.
 */
export function getEnv(key: string, required = false): string | undefined {
  const v = process.env[key];
  if (!v && required && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v;
}

export const config = {
  port: getEnv('PORT') || '3000',
  firebase: {
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: (getEnv('FIREBASE_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
  },
  stunServerUrl: getEnv('STUN_SERVER_URL')
  ,
  // Optional external chat microservice to connect to (socket.io URL)
  chatServiceUrl: getEnv('CHAT_SERVICE_URL'),
  // Optional token used to authenticate this backend with the external chat microservice
  chatServiceToken: getEnv('CHAT_SERVICE_TOKEN'),
  // Voice signaling microservice configuration (Socket.IO + Peer.js signaling)
  voiceServiceUrl: getEnv('VOICE_SERVICE_URL'),
  voiceServiceToken: getEnv('VOICE_SERVICE_TOKEN'),
  webRtcSignalUrl: getEnv('WEBRTC_SIGNAL_URL'),
  iceServerUrl: getEnv('ICE_SERVER_URL'),
  iceServerUsername: getEnv('ICE_SERVER_USERNAME'),
  iceServerCredential: getEnv('ICE_SERVER_CREDENTIAL')
};
