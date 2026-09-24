import { Router } from 'express';
import { SessionsController } from './sessions.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import {
  createSessionSchema,
  joinSessionSchema,
  sessionIdParamSchema,
  classIdParamSchema,
} from './sessions.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { studentAuthMiddleware } from '../../middleware/studentAuthMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { studentJoinLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/join',
  studentJoinLimiter,
  validateMiddleware(joinSessionSchema),
  asyncHandler(SessionsController.studentJoin)
);
router.get(
  '/student/restore',
  studentAuthMiddleware,
  asyncHandler(SessionsController.restoreStudentSession)
);
router.get('/:code/students', studentJoinLimiter, asyncHandler(SessionsController.searchStudents));

router.use(authMiddleware);

router.post('/', validateMiddleware(createSessionSchema), asyncHandler(SessionsController.createSession));
router.get('/', asyncHandler(SessionsController.getAllSessions));
router.get('/class/:classId', validateMiddleware(classIdParamSchema), asyncHandler(SessionsController.listSessions));
router.get('/:id', validateMiddleware(sessionIdParamSchema), asyncHandler(SessionsController.getSession));
router.get('/:id/qr', validateMiddleware(sessionIdParamSchema), asyncHandler(SessionsController.getQRCode));
router.post('/:id/end', validateMiddleware(sessionIdParamSchema), asyncHandler(SessionsController.endSession));

export default router;
