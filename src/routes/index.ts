import { Express } from 'express';
import { healthRouter } from './healthRoutes';
import { userRouter } from './userRoutes';
import { authRouter } from './authRoutes';
import { meetingRouter } from './meetingRoutes';

export function registerRoutes(app: Express) {
  app.use(healthRouter);
  app.use(userRouter);
  app.use(authRouter);
  app.use(meetingRouter);
}
