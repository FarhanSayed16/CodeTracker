import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};
