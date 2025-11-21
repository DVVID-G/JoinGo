import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { initFirebase } from './config/firebase';
import { config } from './config/env';
import { logger } from './utils/logger';
import morgan from 'morgan';

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

registerRoutes(app);
app.use(errorHandler);

app.listen(Number(config.port), () => {
  logger.info(`Server listening on port ${config.port}`);
});
