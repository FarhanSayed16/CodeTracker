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
      const sessions = await SessionsService.getSessionsForClass(req.professorId!, req.params.classId as string);
      return sendSuccess(res, sessions);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async getAllSessions(req: Request, res: Response) {
    try {
      const status = req.query.status as any;
      const sessions = await SessionsService.getAllSessions(req.professorId!, status);
      return sendSuccess(res, sessions);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async getSession(req: Request, res: Response) {
    try {
      const session = await SessionsService.getSession(req.professorId!, req.params.id as string);
      return sendSuccess(res, session);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async endSession(req: Request, res: Response) {
    try {
      const session = await SessionsService.endSession(req.professorId!, req.params.id as string);
      return sendSuccess(res, session, 'Session ended successfully');
    } catch (error: any) {
      if (error.message === 'Session already ended') return sendError(res, error.message, 400);
      return sendError(res, error.message, 403);
    }
  }

  /**
   * Student searches for themselves by name or partial roll number.
   * Public endpoint (no auth required).
   */
  static async searchStudents(req: Request, res: Response) {
    try {
      const sessionCode = req.params.code as string;
      const query = (req.query.q as string) || '';
      const results = await SessionsService.searchStudents(sessionCode, query);
      return sendSuccess(res, results);
    } catch (error: any) {
      if (error.message === 'Invalid session code') return sendError(res, error.message, 404);
      if (error.message === 'Session has ended') return sendError(res, error.message, 403);
      throw error;
    }
  }

  /**
   * Student join — now accepts studentId + optional pin instead of rollNo.
   */
  static async studentJoin(req: Request, res: Response) {
    try {
      const { sessionCode, studentId, pin } = req.body;
      const data = await SessionsService.studentJoin(sessionCode, studentId, pin);
      return sendSuccess(res, data, 'Joined session successfully');
    } catch (error: any) {
      if (error.message === 'Invalid session code') return sendError(res, error.message, 404);
      if (error.message === 'Session has ended') return sendError(res, error.message, 403);
      if (error.message === 'Student not found') return sendError(res, error.message, 404);
      if (error.message === 'Student not enrolled in this class') return sendError(res, error.message, 404);
      if (error.message === 'PIN required') return sendError(res, error.message, 401);
      if (error.message.includes('PIN required')) return sendError(res, error.message, 401);
      if (error.message.includes('Wrong PIN')) return sendError(res, error.message, 401);
      if (error.message.includes('Too many attempts')) return sendError(res, error.message, 429);
      if (error.message.includes('PIN must be')) return sendError(res, error.message, 400);
      throw error;
    }
  }

  /** Restore student widget after refresh (Bearer student JWT). */
  static async restoreStudentSession(req: Request, res: Response) {
    try {
      const student = req.student!;
      const data = await SessionsService.restoreStudentSession(student.studentId, student.sessionId);
      return sendSuccess(res, data);
    } catch (error: any) {
      if (error.message === 'Session not found') return sendError(res, error.message, 404);
      if (error.message === 'Session has ended') return sendError(res, error.message, 403);
      if (error.message.includes('participant')) return sendError(res, error.message, 403);
      if (error.message === 'Student not found') return sendError(res, error.message, 404);
      throw error;
    }
  }

  static async getQRCode(req: Request, res: Response) {
    try {
      const session = await SessionsService.getSession(req.professorId!, req.params.id as string);
      const url = `${req.protocol}://${req.get('host')}/join?code=${session.sessionCode}`;
      
      const QRCode = require('qrcode');
      const dataUrl = await QRCode.toDataURL(url);
      return sendSuccess(res, { dataUrl });
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }
}
