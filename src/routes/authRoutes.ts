import { Router } from 'express';
import { registerController, forgotPasswordController, logoutController, loginController, changeEmailController, changePasswordController, providerSyncController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const authRouter = Router();

authRouter.post('/api/auth/register', asyncHandler(registerController));
authRouter.post('/api/auth/login', asyncHandler(loginController));
authRouter.post('/api/auth/forgot-password', asyncHandler(forgotPasswordController));
authRouter.post('/api/auth/logout', authMiddleware, asyncHandler(logoutController));
authRouter.post('/api/auth/change-email', authMiddleware, asyncHandler(changeEmailController));
authRouter.post('/api/auth/change-password', authMiddleware, asyncHandler(changePasswordController));
authRouter.post('/api/auth/provider-sync', authMiddleware, asyncHandler(providerSyncController));
// Server-side OAuth code-exchange endpoint removed. Use client-side Firebase
// Authentication + POST /api/auth/provider-sync to sync provider profiles.
