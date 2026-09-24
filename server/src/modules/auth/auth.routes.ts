import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateMiddleware } from '../../middleware/validateMiddleware';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from './auth.schema';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateMiddleware(registerSchema),
  asyncHandler(AuthController.register)
);
router.post(
  '/login',
  authLimiter,
  validateMiddleware(loginSchema),
  asyncHandler(AuthController.login)
);
router.get('/me', authMiddleware, asyncHandler(AuthController.getProfile));
router.patch(
  '/me',
  authMiddleware,
  validateMiddleware(updateProfileSchema),
  asyncHandler(AuthController.updateProfile)
);
router.post(
  '/change-password',
  authMiddleware,
  validateMiddleware(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
);

export default router;
