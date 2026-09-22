import { Request, Response } from 'express';
import { ResponsesService } from './responses.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { getIO } from '../../socket';

export class ResponsesController {
  static async updateStatus(req: Request, res: Response) {
    try {
      const student = req.student!;
      const { taskId, status, issueText } = req.body;

      const response = await ResponsesService.updateStatus(student.studentId, student.sessionId, taskId, status, issueText);

      // Emit socket event 'status-update' to room `session_${student.sessionId}`
      const io = getIO();
      io.to(`session_${student.sessionId}`).emit('status-update', {
        studentId: student.studentId,
        taskId,
        status,
        issueText
      });
      
      return sendSuccess(res, response, 'Status updated successfully');
    } catch (error: any) {
      if (error.message.includes('Task not found')) return sendError(res, error.message, 404);
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
      const gridData = await ResponsesService.getStatusGrid(req.professorId!, req.params.sessionId);
      return sendSuccess(res, gridData);
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      throw error;
    }
  }
}
