import { prisma } from '../../config/database';
import { generateUniqueSessionCode } from '../../utils/sessionCode';
import { SessionStatus, TaskStatus } from '../../types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { getIO } from '../../socket';

export class SessionsService {
  static async createSession(professorId: string, classId: string, title: string) {
    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData || classData.professorId !== professorId) {
      throw new Error('Forbidden or Class not found');
    }

    const sessionCode = await generateUniqueSessionCode();

    return prisma.session.create({
      data: {
        classId,
        title,
        sessionCode,
        status: SessionStatus.ACTIVE,
      },
    });
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

  static async getSession(professorId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    return session;
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

    const io = getIO();
    io.to(`session_${sessionId}`).emit('session-ended', { sessionId });

    return updatedSession;
  }

  static async studentJoin(sessionCode: string, rollNo: string) {
    const session = await prisma.session.findUnique({
      where: { sessionCode },
      include: { class: true },
    });

    if (!session) {
      throw new Error('Invalid session code');
    }
    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error('Session has ended');
    }

    const student = await prisma.student.findUnique({
      where: {
        classId_rollNo: {
          classId: session.classId,
          rollNo,
        },
      },
    });

    if (!student) {
      throw new Error('Roll number not found in this class');
    }

    // Add to participants (upsert so it doesn't fail if they rejoin)
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

    // Automatically create empty TaskResponses for all existing tasks in the session
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
      { expiresIn: '8h' }
    );

    return {
      token,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
      },
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
      },
    };

    const io = getIO();
    io.to(`session_${session.id}`).emit('student-joined', {
      studentId: student.id,
      rollNo: student.rollNo,
      name: student.name,
    });

    return result;
  }
}
