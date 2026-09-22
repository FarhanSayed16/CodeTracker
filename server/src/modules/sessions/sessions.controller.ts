import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class SessionsController {
  static async createSession(req: Request, res: Response) {
    try {
      const session = await SessionsService.createSession(req.professorId!, req.body.classId, req.body.title);
      return sendSuccess(res, session, 'Session created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      throw error;
    }
  }

  static async listSessions(req: Request, res: Response) {
    try {
      const sessions = await SessionsService.getSessionsForClass(req.professorId!, req.params.classId);
      return sendSuccess(res, sessions);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async getSession(req: Request, res: Response) {
    try {
      const session = await SessionsService.getSession(req.professorId!, req.params.id);
      return sendSuccess(res, session);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async endSession(req: Request, res: Response) {
    try {
      const session = await SessionsService.endSession(req.professorId!, req.params.id);
      return sendSuccess(res, session, 'Session ended successfully');
    } catch (error: any) {
      if (error.message === 'Session already ended') return sendError(res, error.message, 400);
      return sendError(res, error.message, 403);
    }
  }

  static async studentJoin(req: Request, res: Response) {
    try {
      const data = await SessionsService.studentJoin(req.body.sessionCode, req.body.rollNo);
      return sendSuccess(res, data, 'Joined session successfully');
    } catch (error: any) {
      if (error.message === 'Invalid session code') return sendError(res, error.message, 404);
      if (error.message === 'Session has ended') return sendError(res, error.message, 403);
      if (error.message === 'Roll number not found in this class') return sendError(res, error.message, 404);
      throw error;
    }
  }
}
