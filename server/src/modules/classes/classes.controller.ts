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
      const classData = await ClassesService.getClass(req.professorId!, req.params.id as string);
      return sendSuccess(res, classData);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async previewImport(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded. Please upload an Excel (.xlsx) or CSV file.', 400);
      }

      const result = await ClassesService.previewImport(
        req.professorId!,
        req.params.id as string,
        req.file.buffer
      );
      return sendSuccess(res, result);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      return sendError(res, error.message, 400);
    }
  }

  static async importStudents(req: Request, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded. Please upload an Excel (.xlsx) or CSV file.', 400);
      }

      const result = await ClassesService.importStudents(
        req.professorId!,
        req.params.id as string,
        req.file.buffer,
        req.file.originalname
      );
      return sendSuccess(
        res,
        result,
        `Import complete. Created ${result.created}, linked ${result.linked}, newly enrolled ${result.enrolled}, already enrolled ${result.alreadyEnrolled}.`
      );
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      return sendError(res, error.message, 400);
    }
  }

  static async addStudent(req: Request, res: Response) {
    try {
      const { rollNo, name, membershipId } = req.body;
      if (!rollNo || !name) return sendError(res, 'rollNo and name are required', 400);
      const student = await ClassesService.addStudent(
        req.professorId!,
        req.params.id as string,
        rollNo,
        name,
        membershipId
      );
      return sendSuccess(res, student, 'Student added', 201);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      if (error.message.includes('required')) return sendError(res, error.message, 400);
      throw error;
    }
  }

  static async listStudents(req: Request, res: Response) {
    try {
      const students = await ClassesService.listStudents(req.professorId!, req.params.id as string);
      return sendSuccess(res, students);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async searchPool(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const students = await ClassesService.searchPool(req.professorId!, req.params.id as string, q);
      return sendSuccess(res, students);
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      throw error;
    }
  }

  static async unenrollStudent(req: Request, res: Response) {
    try {
      const result = await ClassesService.unenrollStudent(
        req.professorId!,
        req.params.id as string,
        req.params.studentId as string
      );
      return sendSuccess(res, result, 'Student removed from class');
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      if (error.message.includes('not enrolled')) return sendError(res, error.message, 404);
      throw error;
    }
  }

  static async resetStudentPin(req: Request, res: Response) {
    try {
      const result = await ClassesService.resetStudentPin(
        req.professorId!,
        req.params.id as string,
        req.params.studentId as string
      );
      return sendSuccess(res, result, 'Student PIN reset successfully');
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      if (error.message.includes('not enrolled')) return sendError(res, error.message, 404);
      throw error;
    }
  }

  static async deleteClass(req: Request, res: Response) {
    try {
      const result = await ClassesService.deleteClass(req.professorId!, req.params.id as string);
      return sendSuccess(res, result, 'Class deleted successfully');
    } catch (error: any) {
      if (error.message === 'Class not found') return sendError(res, error.message, 404);
      if (error.message === 'Forbidden') return sendError(res, error.message, 403);
      if (error.message.includes('active session')) return sendError(res, error.message, 400);
      throw error;
    }
  }
}
