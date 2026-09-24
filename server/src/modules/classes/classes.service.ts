import { prisma } from '../../config/database';
import * as XLSX from 'xlsx';

type ParsedStudentRow = { rollNo: string; name: string; membershipId?: string };

function normalizeCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(Math.trunc(value));
  }
  return String(value).trim().replace(/\.0+$/, '');
}

function toPublicStudent(student: {
  id: string;
  rollNo: string;
  name: string;
  membershipId?: string | null;
  pinHash?: string | null;
  _count?: { enrollments: number };
}) {
  return {
    id: student.id,
    rollNo: student.rollNo,
    name: student.name,
    membershipId: student.membershipId ?? undefined,
    hasPin: !!student.pinHash,
    enrollmentCount: student._count?.enrollments ?? undefined,
  };
}

function detectColumns(rawData: unknown[][]) {
  let headerIdx = -1;
  let rollCol = -1;
  let nameCol = -1;
  let memberCol = -1;

  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = (rawData[i] || []) as unknown[];
    let localRoll = -1;
    let localName = -1;
    let localMember = -1;

    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
      if (!cell) continue;

      // Roll / Roll No / Roll No. / Roll Number
      if (cell.includes('roll') && (cell.includes('no') || cell.includes('number') || cell === 'roll')) {
        localRoll = j;
      }
      // Name / Name of Students / Name of the Students
      if (cell.includes('name')) {
        localName = j;
      }
      if (cell.includes('member') || cell.includes('somaiya')) {
        localMember = j;
      }
    }

    if (localRoll >= 0 && localName >= 0) {
      headerIdx = i;
      rollCol = localRoll;
      nameCol = localName;
      memberCol = localMember;
      break;
    }
  }

  return { headerIdx, rollCol, nameCol, memberCol };
}

function parseStudentRows(fileBuffer: Buffer): ParsedStudentRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Spreadsheet has no sheets.');

  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const { headerIdx, rollCol, nameCol, memberCol } = detectColumns(rawData);

  if (headerIdx < 0 || rollCol < 0 || nameCol < 0) {
    throw new Error(
      'Could not detect Roll No. and Name columns. Please ensure your file has columns named "Roll No." / "Roll Number" and "Name".'
    );
  }

  const rows: ParsedStudentRow[] = [];
  const seenRolls = new Set<string>();

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[] | undefined;
    if (!row) continue;

    const rollNo = normalizeCell(row[rollCol]);
    const name = normalizeCell(row[nameCol]);
    const membershipId =
      memberCol >= 0 && row[memberCol] != null && String(row[memberCol]).trim() !== ''
        ? normalizeCell(row[memberCol])
        : undefined;

    if (!rollNo || !name || name.length < 2) continue;
    if (seenRolls.has(rollNo)) continue;
    seenRolls.add(rollNo);

    rows.push({ rollNo, name, membershipId });
  }

  if (rows.length === 0) {
    throw new Error('No valid student rows found in the file.');
  }

  return rows;
}

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
    return prisma.class.findMany({
      where: { professorId },
      include: {
        _count: {
          select: { enrollments: true, sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getClass(professorId: string, classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                rollNo: true,
                name: true,
                membershipId: true,
                pinHash: true,
                _count: { select: { enrollments: true } },
              },
            },
          },
          orderBy: { student: { rollNo: 'asc' } },
        },
        sessions: {
          orderBy: { startedAt: 'desc' },
        },
        _count: {
          select: { sessions: true, enrollments: true },
        },
      },
    });

    if (!classData) throw new Error('Class not found');
    if (classData.professorId !== professorId) throw new Error('Forbidden');

    const students = classData.enrollments.map((e) => ({
      ...toPublicStudent(e.student),
      enrollmentId: e.id,
      enrolledAt: e.enrolledAt,
    }));

    // Never expose enrollments.student.pinHash to clients
    const { enrollments: _enrollments, ...rest } = classData;
    return { ...rest, students };
  }

  static async previewImport(professorId: string, classId: string, fileBuffer: Buffer) {
    await this.assertClassOwnership(professorId, classId);
    const rows = parseStudentRows(fileBuffer);
    return {
      totalParsed: rows.length,
      preview: rows.slice(0, 50),
      truncated: rows.length > 50,
    };
  }

  static async importStudents(professorId: string, classId: string, fileBuffer: Buffer, _fileName?: string) {
    await this.assertClassOwnership(professorId, classId);
    const rows = parseStudentRows(fileBuffer);

    let created = 0;
    let linked = 0;
    let alreadyEnrolled = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        let student = await prisma.student.findUnique({ where: { rollNo: row.rollNo } });

        // Prefer exact roll match; only fall back to membershipId when roll is new
        if (!student && row.membershipId) {
          const byMember = await prisma.student.findUnique({ where: { membershipId: row.membershipId } });
          // Avoid linking if membership belongs to a different roll number
          if (byMember && byMember.rollNo !== row.rollNo) {
            errors.push(
              `Row ${row.rollNo}: membershipId ${row.membershipId} already belongs to roll ${byMember.rollNo}`
            );
            skipped++;
            continue;
          }
          student = byMember;
        }

        const isNew = !student;

        if (!student) {
          student = await prisma.student.create({
            data: {
              rollNo: row.rollNo,
              name: row.name,
              membershipId: row.membershipId,
            },
          });
          created++;
        } else {
          // Keep roster names / member IDs fresh on re-import
          const updates: { name?: string; membershipId?: string } = {};
          if (row.name && row.name !== student.name) updates.name = row.name;
          if (row.membershipId && row.membershipId !== student.membershipId) {
            updates.membershipId = row.membershipId;
          }
          if (Object.keys(updates).length > 0) {
            student = await prisma.student.update({
              where: { id: student.id },
              data: updates,
            });
          }
        }

        const existingEnrollment = await prisma.classEnrollment.findUnique({
          where: { classId_studentId: { classId, studentId: student.id } },
        });

        if (existingEnrollment) {
          alreadyEnrolled++;
        } else {
          await prisma.classEnrollment.create({
            data: { classId, studentId: student.id },
          });
          if (!isNew) linked++;
        }
      } catch (err: any) {
        errors.push(`Row ${row.rollNo}: ${err.message}`);
        skipped++;
      }
    }

    const { cacheDel, CacheKeys } = await import('../../utils/redis');
    await cacheDel(CacheKeys.rosterSearch(classId));

    return {
      totalParsed: rows.length,
      created,
      linked,
      alreadyEnrolled,
      enrolled: created + linked,
      skipped,
      errors,
    };
  }

  static async addStudent(
    professorId: string,
    classId: string,
    rollNo: string,
    name: string,
    membershipId?: string
  ) {
    await this.assertClassOwnership(professorId, classId);

    const normalizedRoll = normalizeCell(rollNo);
    const normalizedName = normalizeCell(name);
    const normalizedMember = membershipId ? normalizeCell(membershipId) : undefined;

    if (!normalizedRoll || !normalizedName) {
      throw new Error('rollNo and name are required');
    }

    let student = await prisma.student.findUnique({ where: { rollNo: normalizedRoll } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          rollNo: normalizedRoll,
          name: normalizedName,
          membershipId: normalizedMember,
        },
      });
    } else {
      const updates: { name?: string; membershipId?: string } = {};
      if (normalizedName !== student.name) updates.name = normalizedName;
      if (normalizedMember && normalizedMember !== student.membershipId) {
        updates.membershipId = normalizedMember;
      }
      if (Object.keys(updates).length > 0) {
        student = await prisma.student.update({ where: { id: student.id }, data: updates });
      }
    }

    await prisma.classEnrollment.upsert({
      where: { classId_studentId: { classId, studentId: student.id } },
      update: {},
      create: { classId, studentId: student.id },
    });

    const { cacheDel, CacheKeys } = await import('../../utils/redis');
    await cacheDel(CacheKeys.rosterSearch(classId));

    return toPublicStudent(student);
  }

  static async listStudents(professorId: string, classId: string) {
    await this.assertClassOwnership(professorId, classId);

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            rollNo: true,
            name: true,
            membershipId: true,
            pinHash: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { student: { rollNo: 'asc' } },
    });

    return enrollments.map((e) => ({
      ...toPublicStudent(e.student),
      enrollmentId: e.id,
      enrolledAt: e.enrolledAt,
    }));
  }

  /** Search global student pool for students not yet enrolled in this class. */
  static async searchPool(professorId: string, classId: string, query: string) {
    await this.assertClassOwnership(professorId, classId);

    const q = query.trim();
    if (q.length < 2) return [];

    const enrolled = await prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    });
    const enrolledIds = enrolled.map((e) => e.studentId);

    const students = await prisma.student.findMany({
      where: {
        id: { notIn: enrolledIds.length ? enrolledIds : undefined },
        OR: [
          { name: { contains: q } },
          { rollNo: { contains: q } },
          { membershipId: { contains: q } },
        ],
      },
      select: {
        id: true,
        rollNo: true,
        name: true,
        membershipId: true,
        pinHash: true,
        _count: { select: { enrollments: true } },
      },
      take: 10,
      orderBy: { rollNo: 'asc' },
    });

    return students.map(toPublicStudent);
  }

  static async unenrollStudent(professorId: string, classId: string, studentId: string) {
    await this.assertClassOwnership(professorId, classId);

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    if (!enrollment) throw new Error('Student not enrolled in this class');

    await prisma.classEnrollment.delete({
      where: { classId_studentId: { classId, studentId } },
    });

    const { cacheDel, CacheKeys } = await import('../../utils/redis');
    await cacheDel(CacheKeys.rosterSearch(classId));

    return { success: true };
  }

  static async resetStudentPin(professorId: string, classId: string, studentId: string) {
    await this.assertClassOwnership(professorId, classId);

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    if (!enrollment) throw new Error('Student not enrolled in this class');

    await prisma.student.update({
      where: { id: studentId },
      data: { pinHash: null, pinAttempts: 0, pinLockedAt: null },
    });

    return { success: true };
  }

  static async deleteClass(professorId: string, classId: string) {
    await this.assertClassOwnership(professorId, classId);

    const activeSession = await prisma.session.findFirst({
      where: { classId, status: 'ACTIVE' },
    });
    if (activeSession) {
      throw new Error('Cannot delete a class with an active session. End the session first.');
    }

    const sessions = await prisma.session.findMany({ where: { classId }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      await prisma.taskResponse.deleteMany({ where: { task: { sessionId: { in: sessionIds } } } });
      await prisma.sessionParticipant.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.task.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
    }

    await prisma.classEnrollment.deleteMany({ where: { classId } });
    await prisma.class.delete({ where: { id: classId } });

    return { success: true };
  }

  private static async assertClassOwnership(professorId: string, classId: string) {
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) throw new Error('Class not found');
    if (classData.professorId !== professorId) throw new Error('Forbidden');
    return classData;
  }
}
