import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * In production, warn (and optionally reject) plain HTTP when not behind a TLS-terminating proxy.
 * Set REQUIRE_HTTPS=true to send 403 for non-HTTPS requests (honors X-Forwarded-Proto).
 */
export function httpsProductionGuard(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') return next();

  const proto = (req.get('x-forwarded-proto') || req.protocol || '').toLowerCase();
  const secure = proto === 'https' || req.secure;

  if (!secure) {
    logger.warn(
      { path: req.path, proto },
      'Non-HTTPS request in production — terminate TLS at the reverse proxy'
    );
    if (process.env.REQUIRE_HTTPS === 'true') {
      return res.status(403).json({
        success: false,
        error: 'HTTPS required',
      });
    }
  }
  return next();
}
