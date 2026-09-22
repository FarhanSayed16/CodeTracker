import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { createTaskSchema, taskIdParamSchema } from './tasks.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.post('/', validateMiddleware(createTaskSchema), asyncHandler(TasksController.createTask));
router.get('/session/:sessionId', asyncHandler(TasksController.listTasks));
router.delete('/:id', validateMiddleware(taskIdParamSchema), asyncHandler(TasksController.deleteTask));

export default router;
