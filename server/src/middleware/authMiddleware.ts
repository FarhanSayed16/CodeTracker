import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';
import { prisma } from '../config/database';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { professorId: string };

    const professor = await prisma.professor.findUnique({
      where: { id: decoded.professorId },
    });

    if (!professor) {
      return sendError(res, 'Invalid token', 401);
    }

    req.professorId = decoded.professorId;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
