import { Router } from 'express';
import { DepartmentsController } from './departments.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// List remains public for registration department picker
router.get('/', asyncHandler(DepartmentsController.list));
router.post('/', authMiddleware, asyncHandler(DepartmentsController.create));

export default router;
