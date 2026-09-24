import { Request, Response } from 'express';
import { ResponsesService } from './responses.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class ResponsesController {
  static async updateStatus(req: Request, res: Response) {
    try {
      const student = req.student!;
      const { taskId, status, issueText } = req.body;

      const response = await ResponsesService.updateStatus(
        student.studentId,
        student.sessionId,
        taskId,
        status,
        issueText
      );

      return sendSuccess(res, response, 'Status updated successfully');
    } catch (error: any) {
      if (error.message.includes('Task not found')) return sendError(res, error.message, 404);
      if (error.message.includes('not a participant')) return sendError(res, error.message, 403);
      if (error.message.includes('Grace window expired')) return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async getStudentResponses(req: Request, res: Response) {
    try {
      const student = req.student!;
      const responses = await ResponsesService.getStudentResponses(student.studentId, student.sessionId);
      return sendSuccess(res, responses);
    } catch (error: any) {
      throw error;
    }
  }

  static async getStatusGrid(req: Request, res: Response) {
    try {
      const gridData = await ResponsesService.getStatusGrid(req.professorId!, req.params.sessionId as string);
      return sendSuccess(res, gridData);
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      throw error;
    }
  }

  static async getIssues(req: Request, res: Response) {
    try {
      const issues = await ResponsesService.getIssues(req.professorId!, req.params.sessionId as string);
      return sendSuccess(res, issues);
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      throw error;
    }
  }
  static async resolveIssue(req: Request, res: Response) {
    try {
      const { taskId, studentId } = req.body;
      const response = await ResponsesService.resolveIssue(req.professorId!, req.params.sessionId as string, studentId, taskId);
      return sendSuccess(res, response, 'Issue resolved successfully');
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      throw error;
    }
  }
}
