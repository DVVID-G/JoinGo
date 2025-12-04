import { Router } from 'express';
import { createMeetingController, getMeetingController, getMeetingMessagesController, getMyMeetingsController } from '../controllers/meetingController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { wrapAsync } from '../utils/asyncHandler';

export const meetingRouter = Router();

meetingRouter.post('/api/meetings', authMiddleware, wrapAsync(createMeetingController));
// Return meetings owned by the authenticated user
meetingRouter.get('/api/meetings', authMiddleware, wrapAsync(getMyMeetingsController));
meetingRouter.get('/api/meetings/:id', wrapAsync(getMeetingController));
// Fetch recent persisted messages for a meeting (protected)
meetingRouter.get('/api/meetings/:id/messages', authMiddleware, wrapAsync(getMeetingMessagesController));
// Update meeting status (soft-delete / restore)
meetingRouter.patch('/api/meetings/:id/status', authMiddleware, wrapAsync(async (req, res) => {
	// Delegate to controller
	return await (await import('../controllers/meetingController')).updateMeetingStatusController(req as any, res as any);
}));
