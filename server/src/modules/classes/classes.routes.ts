import { Router } from 'express';
import multer from 'multer';
import { ClassesController } from './classes.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import {
  createClassSchema,
  classIdParamSchema,
  classStudentParamSchema,
  addStudentSchema,
} from './classes.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/', validateMiddleware(createClassSchema), asyncHandler(ClassesController.createClass));
router.get('/', asyncHandler(ClassesController.listClasses));
router.get('/:id', validateMiddleware(classIdParamSchema), asyncHandler(ClassesController.getClass));

router.post(
  '/:id/import/preview',
  upload.single('file'),
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.previewImport)
);

router.post(
  '/:id/import',
  upload.single('file'),
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.importStudents)
);

router.post(
  '/:id/students',
  validateMiddleware(addStudentSchema),
  asyncHandler(ClassesController.addStudent)
);

router.get(
  '/:id/students',
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.listStudents)
);

router.get(
  '/:id/students/search-pool',
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.searchPool)
);

router.delete(
  '/:id/students/:studentId',
  validateMiddleware(classStudentParamSchema),
  asyncHandler(ClassesController.unenrollStudent)
);

router.post(
  '/:id/students/:studentId/reset-pin',
  validateMiddleware(classStudentParamSchema),
  asyncHandler(ClassesController.resetStudentPin)
);

// Legacy CSV upload (backwards compatible)
router.post(
  '/:id/roster',
  upload.single('file'),
  validateMiddleware(classIdParamSchema),
  asyncHandler(ClassesController.importStudents)
);

router.delete('/:id', validateMiddleware(classIdParamSchema), asyncHandler(ClassesController.deleteClass));

export default router;
