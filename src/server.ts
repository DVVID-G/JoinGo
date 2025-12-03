import express from 'express';
import cors from 'cors';
import http from 'http';
import { registerRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { initFirebase } from './config/firebase';
import { config } from './config/env';
import { logger } from './utils/logger';
import morgan from 'morgan';
import { initChatClient } from './realtime/chatClient';
import { initVoiceClient } from './realtime/voiceClient';

initFirebase();

const app = express();
app.use(cors());
app.use(express.json());

// Configure morgan to use our logger stream so logs are consistent
app.use(morgan('dev', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

app.get('/', (_req, res) => {
  res.send('🚀 JoinGo Backend is active! Ready to connect.');
});

registerRoutes(app);
app.use(errorHandler);

const server = http.createServer(app);
// initialize optional external chat client (connects to separate chat microservice)
initChatClient();
// initialize optional voice signaling client (connects to voice microservice)
initVoiceClient();

server.listen(Number(config.port), () => {
  logger.info(`Server listening on port ${config.port}`);
});
