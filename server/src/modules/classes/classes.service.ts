import { prisma } from '../../config/database';
import { parseRosterCsv } from '../../utils/csvParser';

export class ClassesService {
  static async createClass(professorId: string, className: string) {
    return prisma.class.create({
      data: {
        className,
        professorId,
      },
    });
  }

  static async listClasses(professorId: string) {
    const classes = await prisma.class.findMany({
      where: { professorId },
      include: {
        _count: {
          select: { students: true, sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return classes;
  }

  static async getClass(professorId: string, classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          orderBy: { rollNo: 'asc' },
        },
        sessions: {
          orderBy: { startedAt: 'desc' },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!classData) throw new Error('Class not found');
    if (classData.professorId !== professorId) throw new Error('Forbidden');

    return classData;
  }

  static async uploadRoster(professorId: string, classId: string, fileBuffer: Buffer) {
    // Verify ownership
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) throw new Error('Class not found');
    if (classData.professorId !== professorId) throw new Error('Forbidden');

    const csvString = fileBuffer.toString('utf-8');
    const { validRows, errors } = parseRosterCsv(csvString);

    let addedCount = 0;
    let duplicateCount = 0;

    for (const row of validRows) {
      // Upsert to handle potential duplicates cleanly, or skip if rollNo exists in class
      const existing = await prisma.student.findUnique({
        where: {
          classId_rollNo: {
            classId,
            rollNo: row.roll_no,
          },
        },
      });

      if (existing) {
        duplicateCount++;
      } else {
        await prisma.student.create({
          data: {
            classId,
            rollNo: row.roll_no,
            name: row.name,
          },
        });
        addedCount++;
      }
    }

    return {
      addedCount,
      duplicateCount,
      errorsCount: errors.length,
      errors,
    };
  }

  static async listStudents(professorId: string, classId: string) {
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) throw new Error('Class not found');
    if (classData.professorId !== professorId) throw new Error('Forbidden');

    return prisma.student.findMany({
      where: { classId },
      orderBy: { rollNo: 'asc' },
    });
  }
}
