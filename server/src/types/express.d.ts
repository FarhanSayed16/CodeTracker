import { Professor } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      professorId?: string;
      student?: {
        studentId: string;
        rollNo: string;
        name: string;
        sessionId: string;
      };
    }
  }
}
