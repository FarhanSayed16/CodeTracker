import { prisma } from '../../config/database';

export class DepartmentsService {
  static async createDepartment(name: string, institutionId: string) {
    return prisma.department.create({
      data: { name, institutionId }
    });
  }

  static async listDepartments(institutionId?: string) {
    return prisma.department.findMany({
      where: institutionId ? { institutionId } : undefined,
      include: { 
        institution: true,
        _count: { select: { professors: true } }
      },
      orderBy: { name: 'asc' }
    });
  }
}
