import { Router } from 'express';
import { ResponsesController } from './responses.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { updateStatusSchema, sessionParamSchema } from './responses.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { studentAuthMiddleware } from '../../middleware/studentAuthMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Student routes (require student JWT)
router.post('/status', studentAuthMiddleware, validateMiddleware(updateStatusSchema), asyncHandler(ResponsesController.updateStatus));
router.get('/my-responses', studentAuthMiddleware, asyncHandler(ResponsesController.getStudentResponses));

// Professor routes (require professor JWT)
router.get('/grid/:sessionId', authMiddleware, validateMiddleware(sessionParamSchema), asyncHandler(ResponsesController.getStatusGrid));

export default router;
