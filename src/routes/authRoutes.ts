import { Router } from 'express';
import { registerController, forgotPasswordController, logoutController, loginController, changeEmailController, changePasswordController, providerSyncController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/api/auth/register', registerController);
authRouter.post('/api/auth/login', loginController);
authRouter.post('/api/auth/forgot-password', forgotPasswordController);
authRouter.post('/api/auth/logout', authMiddleware, logoutController);
authRouter.post('/api/auth/change-email', authMiddleware, changeEmailController);
authRouter.post('/api/auth/change-password', authMiddleware, changePasswordController);
authRouter.post('/api/auth/provider-sync', authMiddleware, providerSyncController);
// Server-side OAuth code-exchange endpoint removed. Use client-side Firebase
// Authentication + POST /api/auth/provider-sync to sync provider profiles.
