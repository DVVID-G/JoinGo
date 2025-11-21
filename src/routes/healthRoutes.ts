import { Router } from 'express';
import { getHealth } from '../controllers/healthController';
import { asyncHandler } from '../utils/asyncHandler';

export const healthRouter = Router();
healthRouter.get('/health', asyncHandler(getHealth));
