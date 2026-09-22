import { Router } from 'express';
import multer from 'multer';
import { ClassesController } from './classes.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { createClassSchema, classIdParamSchema } from './classes.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(authMiddleware);

router.post('/', validateMiddleware(createClassSchema), asyncHandler(ClassesController.createClass));
router.get('/', asyncHandler(ClassesController.listClasses));
router.get('/:id', validateMiddleware(classIdParamSchema), asyncHandler(ClassesController.getClass));
router.post(
  '/:id/roster',
  upload.single('file'),
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.uploadRoster)
);
router.get('/:id/students', validateMiddleware(classIdParamSchema), asyncHandler(ClassesController.listStudents));

export default router;
