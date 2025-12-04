import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { wrapAsync } from '../utils/asyncHandler';
import { createVoiceSessionController, getVoiceConfigController } from '../controllers/voiceController';

export const voiceRouter = Router();

voiceRouter.get('/api/voice/config', authMiddleware, wrapAsync(getVoiceConfigController));
voiceRouter.post('/api/voice/session', authMiddleware, wrapAsync(createVoiceSessionController));
