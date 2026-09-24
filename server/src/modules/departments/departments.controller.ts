import { Request, Response } from 'express';
import { DepartmentsService } from './departments.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class DepartmentsController {
  static async create(req: Request, res: Response) {
    try {
      const { name, institutionId } = req.body;
      if (!name || !institutionId) return sendError(res, 'Name and institutionId are required', 400);
      const department = await DepartmentsService.createDepartment(name, institutionId);
      return sendSuccess(res, department, 'Department created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const institutionId = req.query.institutionId as string | undefined;
      const departments = await DepartmentsService.listDepartments(institutionId);
      return sendSuccess(res, departments);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
}
