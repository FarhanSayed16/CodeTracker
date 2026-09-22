import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { registerSchema, loginSchema } from './auth.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/register', validateMiddleware(registerSchema), asyncHandler(AuthController.register));
router.post('/login', validateMiddleware(loginSchema), asyncHandler(AuthController.login));
router.get('/me', authMiddleware, asyncHandler(AuthController.getProfile));

export default router;
