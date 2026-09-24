import { prisma } from '../../config/database';

export class InstitutionsService {
  static async createInstitution(name: string) {
    return prisma.institution.create({
      data: { name }
    });
  }

  static async listInstitutions() {
    return prisma.institution.findMany({
      include: { _count: { select: { departments: true } } },
      orderBy: { name: 'asc' }
    });
  }
}
