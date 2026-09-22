import { Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { getIO } from '../../socket';

export class TasksController {
  static async createTask(req: Request, res: Response) {
    try {
      const task = await TasksService.createTask(
        req.professorId!,
        req.body.sessionId,
        req.body.title,
        req.body.description
      );

      // Emit socket event 'new-task' to the room `session_${sessionId}`
      const io = getIO();
      io.to(`session_${req.body.sessionId}`).emit('new-task', task);
      
      return sendSuccess(res, task, 'Task created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      if (error.message.includes('ended session')) {
        return sendError(res, error.message, 400);
      }
      throw error;
    }
  }

  static async listTasks(req: Request, res: Response) {
    try {
      const tasks = await TasksService.listTasks(req.professorId!, req.params.sessionId);
      return sendSuccess(res, tasks);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const result = await TasksService.deleteTask(req.professorId!, req.params.id);
      
      const io = getIO();
      io.to(`session_${result.task.sessionId}`).emit('task-removed', { taskId: result.task.id });
      
      return sendSuccess(res, null, 'Task deleted successfully');
    } catch (error: any) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return sendError(res, error.message, 403);
      }
      if (error.message.includes('ended session')) {
        return sendError(res, error.message, 400);
      }
      throw error;
    }
  }
}
