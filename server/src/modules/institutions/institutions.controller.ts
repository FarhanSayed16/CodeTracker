import { Request, Response } from 'express';
import { InstitutionsService } from './institutions.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export class InstitutionsController {
  static async create(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) return sendError(res, 'Name is required', 400);
      const institution = await InstitutionsService.createInstitution(name);
      return sendSuccess(res, institution, 'Institution created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const institutions = await InstitutionsService.listInstitutions();
      return sendSuccess(res, institutions);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
}
