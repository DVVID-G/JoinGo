import { Router } from 'express';
import { getHealth } from '../controllers/healthController';
import { wrapAsync } from '../utils/asyncHandler';

export const healthRouter = Router();
healthRouter.get('/health', wrapAsync(getHealth));

