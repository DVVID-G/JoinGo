import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { syncUserProfile, getMe, updateMe, deleteMe } from '../controllers/userController';
import { wrapAsync } from '../utils/asyncHandler';

export const userRouter = Router();
userRouter.post('/api/users/sync', authMiddleware, wrapAsync(syncUserProfile));
userRouter.get('/api/users/me', authMiddleware, wrapAsync(getMe));
userRouter.put('/api/users/me', authMiddleware, wrapAsync(updateMe));
userRouter.delete('/api/users/me', authMiddleware, wrapAsync(deleteMe));
