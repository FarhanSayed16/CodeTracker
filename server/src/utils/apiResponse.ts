import { Response } from 'express';

export function sendSuccess(res: Response, data: any = null, message?: string, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(res: Response, error: string, statusCode = 400) {
  res.status(statusCode).json({
    success: false,
    error,
  });
}
