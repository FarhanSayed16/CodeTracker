import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export const validateMiddleware =
  (schema: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error.errors) {
        // Just return the first formatted error or the full array, simplified here:
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors || [],
        });
      }
      return sendError(res, 'Internal validation error', 500);
    }
  };
