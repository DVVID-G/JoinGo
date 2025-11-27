import { Router } from 'express';
import { registerController, forgotPasswordController, logoutController, loginController, changeEmailController, changePasswordController, providerSyncController, oauthController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { wrapAsync } from '../utils/asyncHandler';

export const authRouter = Router();

authRouter.post('/api/auth/register', wrapAsync(registerController));
authRouter.post('/api/auth/login', wrapAsync(loginController));
authRouter.post('/api/auth/forgot-password', wrapAsync(forgotPasswordController));
authRouter.post('/api/auth/logout', authMiddleware, wrapAsync(logoutController));
authRouter.post('/api/auth/change-email', authMiddleware, wrapAsync(changeEmailController));
authRouter.post('/api/auth/change-password', authMiddleware, wrapAsync(changePasswordController));
authRouter.post('/api/auth/provider-sync', authMiddleware, wrapAsync(providerSyncController));
authRouter.post('/api/auth/oauth', wrapAsync(oauthController));
