import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { createSessionSchema, joinSessionSchema, sessionIdParamSchema, classIdParamSchema } from './sessions.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Student routes (public, returns JWT on success)
router.post('/join', validateMiddleware(joinSessionSchema), asyncHandler(SessionsController.studentJoin));

// Professor routes
router.use(authMiddleware);

router.post('/', validateMiddleware(createSessionSchema), asyncHandler(SessionsController.createSession));
router.get('/class/:classId', validateMiddleware(classIdParamSchema), asyncHandler(SessionsController.listSessions));
router.get('/:id', validateMiddleware(sessionIdParamSchema), asyncHandler(SessionsController.getSession));
router.post('/:id/end', validateMiddleware(sessionIdParamSchema), asyncHandler(SessionsController.endSession));

export default router;
