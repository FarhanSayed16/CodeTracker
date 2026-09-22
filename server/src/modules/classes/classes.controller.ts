import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class ClassesController {
  static async createClass(req: Request, res: Response) {
    const classData = await ClassesService.createClass(req.professorId!, req.body.className);
    return sendSuccess(res, classData, 'Class created successfully', 201);
  }

  static async listClasses(req: Request, res: Response) {
    const classes = await ClassesService.listClasses(req.professorId!);
    return sendSuccess(res, classes);
  }

  static async getClass(req: Request, res: Response) {
    try {
      const classData = await ClassesService.getClass(req.professorId!, req.params.id);
      return sendSuccess(res, classData);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async uploadRoster(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No CSV file uploaded', 400);
      }
      
      const result = await ClassesService.uploadRoster(req.professorId!, req.params.id, req.file.buffer);
      return sendSuccess(res, result, `Roster uploaded. Added ${result.addedCount} students.`);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async listStudents(req: Request, res: Response) {
    try {
      const students = await ClassesService.listStudents(req.professorId!, req.params.id);
      return sendSuccess(res, students);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }
}
