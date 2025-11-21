import { Router } from 'express';
import { registerController, forgotPasswordController, logoutController, loginController, changeEmailController, changePasswordController, providerSyncController, oauthController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/api/auth/register', registerController);
authRouter.post('/api/auth/login', loginController);
authRouter.post('/api/auth/forgot-password', forgotPasswordController);
authRouter.post('/api/auth/logout', authMiddleware, logoutController);
authRouter.post('/api/auth/change-email', authMiddleware, changeEmailController);
authRouter.post('/api/auth/change-password', authMiddleware, changePasswordController);
authRouter.post('/api/auth/provider-sync', authMiddleware, providerSyncController);
authRouter.post('/api/auth/oauth', oauthController);
