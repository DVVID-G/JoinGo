import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { syncUserProfile, getMe, updateMe, deleteMe } from '../controllers/userController';

export const userRouter = Router();
userRouter.post('/api/users/sync', authMiddleware, syncUserProfile);
userRouter.get('/api/users/me', authMiddleware, getMe);
userRouter.put('/api/users/me', authMiddleware, updateMe);
userRouter.delete('/api/users/me', authMiddleware, deleteMe);
