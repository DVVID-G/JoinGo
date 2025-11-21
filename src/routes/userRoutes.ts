import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { syncUserProfile, getMe, updateMe, deleteMe } from '../controllers/userController';
import { asyncHandler } from '../utils/asyncHandler';

export const userRouter = Router();
userRouter.post('/api/users/sync', authMiddleware, asyncHandler(syncUserProfile));
userRouter.get('/api/users/me', authMiddleware, asyncHandler(getMe));
userRouter.put('/api/users/me', authMiddleware, asyncHandler(updateMe));
userRouter.delete('/api/users/me', authMiddleware, asyncHandler(deleteMe));
