import { prisma } from '../../config/database';
import { generateUniqueSessionCode } from '../../utils/sessionCode';
import { SessionStatus, TaskStatus } from '../../types/enums';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { env } from '../../config/env';
import { emitToSession, emitToProfessor } from '../../socket';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '../../utils/redis';
import { publishSessionStatus } from '../../utils/mqttClient';

const PIN_LOCKOUT_MS = 30_000;
const MAX_PIN_ATTEMPTS = 3;

type RosterStudent = {
  id: string;
  rollNo: string;
  name: string;
  pinHash: string | null;
};

export class SessionsService {
  static async createSession(professorId: string, classId: string, title: string) {
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData || classData.professorId !== professorId) {
      throw new Error('Forbidden or Class not found');
    }

    const sessionCode = await generateUniqueSessionCode();

    const session = await prisma.session.create({
      data: {
        classId,
        title,
        sessionCode,
        status: SessionStatus.ACTIVE,
      },
    });

    await cacheSet(
      CacheKeys.sessionByCode(sessionCode),
      { id: session.id, classId, status: session.status, title: session.title },
      CacheTTL.sessionByCode
    );

    return session;
  }

  static async getSessionsForClass(professorId: string, classId: string) {
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData || classData.professorId !== professorId) {
      throw new Error('Forbidden or Class not found');
    }

    return prisma.session.findMany({
      where: { classId },
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { participants: true, tasks: true } },
      },
    });
  }

  static async getAllSessions(professorId: string, status?: SessionStatus) {
    return prisma.session.findMany({
      where: {
        class: { professorId },
        ...(status ? { status } : {}),
      },
      orderBy: { startedAt: 'desc' },
      include: {
        class: true,
        _count: { select: { participants: true, tasks: true } },
      },
    });
  }

  static async getSession(professorId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: true,
        tasks: { orderBy: { taskNumber: 'asc' } },
        participants: {
          include: { student: { select: { id: true, rollNo: true, name: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { participants: true, tasks: true } },
      },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    const responses = await prisma.taskResponse.findMany({
      where: { task: { sessionId } },
      select: { status: true },
    });

    const statusCounts = {
      not_started: 0,
      in_progress: 0,
      done: 0,
      issue: 0,
    };
    for (const r of responses) {
      if (r.status === TaskStatus.DONE) statusCounts.done++;
      else if (r.status === TaskStatus.ISSUE) statusCounts.issue++;
      else if (r.status === TaskStatus.IN_PROGRESS) statusCounts.in_progress++;
      else statusCounts.not_started++;
    }

    return { ...session, statusCounts };
  }

  static async endSession(professorId: string, sessionId: string) {
    const session = await this.getSession(professorId, sessionId);

    if (session.status === SessionStatus.ENDED) {
      throw new Error('Session already ended');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ENDED,
        endedAt: new Date(),
      },
    });

    await cacheDel(CacheKeys.sessionByCode(session.sessionCode));
    emitToSession(sessionId, 'session-ended', { sessionId });
    publishSessionStatus(sessionId, { event: 'session-ended', sessionId });

    return updatedSession;
  }

  private static async resolveSessionByCode(sessionCode: string) {
    const code = sessionCode.toUpperCase();
    const cached = await cacheGet<{
      id: string;
      classId: string;
      status: string;
      title: string;
    }>(CacheKeys.sessionByCode(code));

    if (cached) return cached;

    const session = await prisma.session.findUnique({
      where: { sessionCode: code },
      select: { id: true, classId: true, status: true, title: true, sessionCode: true },
    });
    if (!session) return null;

    await cacheSet(
      CacheKeys.sessionByCode(code),
      {
        id: session.id,
        classId: session.classId,
        status: session.status,
        title: session.title,
      },
      CacheTTL.sessionByCode
    );
    return session;
  }

  private static async getRosterStudents(classId: string): Promise<RosterStudent[]> {
    const cached = await cacheGet<RosterStudent[]>(CacheKeys.rosterSearch(classId));
    if (cached) return cached;

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, rollNo: true, name: true, pinHash: true },
        },
      },
    });

    const roster = enrollments.map((e) => e.student);
    await cacheSet(CacheKeys.rosterSearch(classId), roster, CacheTTL.rosterSearch);
    return roster;
  }

  static async searchStudents(sessionCode: string, query: string) {
    const session = await this.resolveSessionByCode(sessionCode);
    if (!session) throw new Error('Invalid session code');
    if (session.status !== SessionStatus.ACTIVE) throw new Error('Session has ended');

    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const roster = await this.getRosterStudents(session.classId);

    return roster
      .filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const roll = s.rollNo.toLowerCase();
        const rollMatch = roll.endsWith(q) || roll.includes(q);
        return nameMatch || rollMatch;
      })
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        rollNo: maskRollNo(s.rollNo),
        hasPin: !!s.pinHash,
      }));
  }

  static async restoreStudentSession(studentId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        title: true,
        status: true,
        sessionCode: true,
      },
    });

    if (!session) throw new Error('Session not found');
    if (session.status !== SessionStatus.ACTIVE) throw new Error('Session has ended');

    const participant = await prisma.sessionParticipant.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
    if (!participant) throw new Error('Not a participant of this session');

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, rollNo: true },
    });
    if (!student) throw new Error('Student not found');

    const tasks = await prisma.task.findMany({
      where: { sessionId },
      orderBy: { taskNumber: 'asc' },
    });

    const responses = await prisma.taskResponse.findMany({
      where: { studentId, taskId: { in: tasks.map((t) => t.id) } },
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        sessionCode: session.sessionCode,
      },
      student,
      tasks,
      responses,
    };
  }

  static async studentJoin(sessionCode: string, studentId: string, pin?: string) {
    const session = await prisma.session.findUnique({
      where: { sessionCode: sessionCode.toUpperCase() },
      include: { class: true },
    });

    if (!session) throw new Error('Invalid session code');
    if (session.status !== SessionStatus.ACTIVE) throw new Error('Session has ended');

    let student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Student not found');

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId: session.classId, studentId: student.id } },
    });
    if (!enrollment) throw new Error('Student not enrolled in this class');

    const requirePin = env.REQUIRE_STUDENT_PIN;

    if (student.pinHash) {
      const existingPinHash = student.pinHash;
      if (!pin) throw new Error('PIN required');

      if (student.pinLockedAt) {
        const elapsed = Date.now() - student.pinLockedAt.getTime();
        if (elapsed < PIN_LOCKOUT_MS) {
          const remainSec = Math.ceil((PIN_LOCKOUT_MS - elapsed) / 1000);
          throw new Error(`Too many attempts. Try again in ${remainSec} seconds.`);
        }
        student = await prisma.student.update({
          where: { id: student.id },
          data: { pinAttempts: 0, pinLockedAt: null },
        });
      }

      const valid = await argon2.verify(existingPinHash, pin);
      if (!valid) {
        const attempts = student.pinAttempts + 1;
        if (attempts >= MAX_PIN_ATTEMPTS) {
          await prisma.student.update({
            where: { id: student.id },
            data: { pinAttempts: attempts, pinLockedAt: new Date() },
          });
          throw new Error(`Too many attempts. Try again in ${PIN_LOCKOUT_MS / 1000} seconds.`);
        }
        await prisma.student.update({
          where: { id: student.id },
          data: { pinAttempts: attempts },
        });
        throw new Error(`Wrong PIN. ${MAX_PIN_ATTEMPTS - attempts} attempts remaining.`);
      }

      if (student.pinAttempts > 0 || student.pinLockedAt) {
        await prisma.student.update({
          where: { id: student.id },
          data: { pinAttempts: 0, pinLockedAt: null },
        });
      }
    } else if (requirePin) {
      if (!pin) throw new Error('PIN required — create a 4-digit PIN to join');
      if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
      const pinHash = await argon2.hash(pin);
      await prisma.student.update({
        where: { id: student.id },
        data: { pinHash, pinAttempts: 0, pinLockedAt: null },
      });
    } else if (pin) {
      if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
      const pinHash = await argon2.hash(pin);
      await prisma.student.update({
        where: { id: student.id },
        data: { pinHash },
      });
    }

    await prisma.sessionParticipant.upsert({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        sessionId: session.id,
        studentId: student.id,
      },
    });

    const tasks = await prisma.task.findMany({ where: { sessionId: session.id } });
    for (const task of tasks) {
      await prisma.taskResponse.upsert({
        where: { taskId_studentId: { taskId: task.id, studentId: student.id } },
        update: {},
        create: {
          taskId: task.id,
          studentId: student.id,
          status: TaskStatus.NOT_STARTED,
        },
      });
    }

    const token = jwt.sign(
      {
        studentId: student.id,
        rollNo: student.rollNo,
        name: student.name,
        sessionId: session.id,
      },
      env.JWT_SECRET,
      { expiresIn: env.STUDENT_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    emitToProfessor(session.id, 'student-joined', {
      studentId: student.id,
      rollNo: student.rollNo,
      name: student.name,
    });

    return {
      token,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        sessionCode: session.sessionCode,
      },
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
      },
      tasks,
    };
  }
}

function maskRollNo(rollNo: string): string {
  if (rollNo.length <= 3) return rollNo;
  const visible = Math.min(3, rollNo.length);
  return `${'*'.repeat(rollNo.length - visible)}${rollNo.slice(-visible)}`;
}
