import { Router } from 'express';
import { InstitutionsController } from './institutions.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// List is public so RegisterPage can show departments via related endpoints;
// create requires authenticated professor (Phase 26 will add admin RBAC).
router.get('/', asyncHandler(InstitutionsController.list));
router.post('/', authMiddleware, asyncHandler(InstitutionsController.create));

export default router;
