import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';

export type StudentTokenPayload = {
  studentId: string;
  rollNo: string;
  name: string;
  sessionId: string;
};

/** Auth for student JWT issued at session join. */
export const studentAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as StudentTokenPayload;

    if (!decoded.studentId || !decoded.sessionId) {
      return sendError(res, 'Invalid student token', 401);
    }

    req.student = {
      studentId: decoded.studentId,
      rollNo: decoded.rollNo,
      name: decoded.name,
      sessionId: decoded.sessionId,
    };
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
