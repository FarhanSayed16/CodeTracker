import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = await AuthService.register(req.body);
      return sendSuccess(res, data, 'Registration successful', 201);
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return sendError(res, error.message, 409);
      }
      throw error;
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = await AuthService.login(req.body);
      return sendSuccess(res, data, 'Login successful');
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return sendError(res, error.message, 401);
      }
      throw error;
    }
  }

  static async getProfile(req: Request, res: Response) {
    const professorId = req.professorId!;
    const profile = await AuthService.getProfile(professorId);
    return sendSuccess(res, profile);
  }
}
