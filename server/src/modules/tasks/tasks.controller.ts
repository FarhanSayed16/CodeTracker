import { Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class TasksController {
  static async createTask(req: Request, res: Response) {
    try {
      const task = await TasksService.createTask(
        req.professorId!,
        req.body.sessionId,
        req.body.title,
        req.body.description
      );

      // Socket emit happens in TasksService via emitToStudents
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
      const tasks = await TasksService.listTasks(req.professorId!, req.params.sessionId as string);
      return sendSuccess(res, tasks);
    } catch (error: any) {
      return sendError(res, error.message, 403);
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      await TasksService.deleteTask(req.professorId!, req.params.id as string);
      // Socket emit happens in TasksService via emitToStudents
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

  static async updateTask(req: Request, res: Response) {
    try {
      const task = await TasksService.updateTask(
        req.professorId!,
        req.params.id as string,
        req.body.title,
        req.body.description
      );
      return sendSuccess(res, task, 'Task updated successfully');
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
