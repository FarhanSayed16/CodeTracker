import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';
import { prisma } from '../config/database';
import { SessionStatus } from '../types/enums';

export const studentAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      studentId: string;
      rollNo: string;
      name: string;
      sessionId: string;
    };

    // Check if session is still active
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      select: { status: true },
    });

    if (!session) {
      return sendError(res, 'Session not found', 404);
    }

    if (session.status !== SessionStatus.ACTIVE) {
      return sendError(res, 'Session has ended', 403);
    }

    req.student = {
      studentId: decoded.studentId,
      rollNo: decoded.rollNo,
      name: decoded.name,
      sessionId: decoded.sessionId,
    };
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired student token', 401);
  }
};
