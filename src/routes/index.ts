import { Express } from 'express';
import { healthRouter } from './healthRoutes';
import { userRouter } from './userRoutes';
import { authRouter } from './authRoutes';
import { meetingRouter } from './meetingRoutes';
import { voiceRouter } from './voiceRoutes';

export function registerRoutes(app: Express) {
  app.use(healthRouter);
  app.use(userRouter);
  app.use(authRouter);
  app.use(meetingRouter);
  app.use(voiceRouter);
}
