import { prisma } from '../../config/database';
import { TaskStatus } from '../../types/enums';

export class ResponsesService {
  static async updateStatus(studentId: string, sessionId: string, taskId: string, status: TaskStatus, issueText?: string | null) {
    // Verify the task belongs to the session
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.sessionId !== sessionId) {
      throw new Error('Task not found in this session');
    }

    if (status !== TaskStatus.ISSUE) {
      issueText = null;
    }

    const response = await prisma.taskResponse.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId,
        },
      },
      update: {
        status,
        issueText,
      },
      create: {
        taskId,
        studentId,
        status,
        issueText,
      },
    });

    return response;
  }

  static async getStudentResponses(studentId: string, sessionId: string) {
    const tasks = await prisma.task.findMany({
      where: { sessionId },
      include: {
        responses: {
          where: { studentId },
        },
      },
      orderBy: { taskNumber: 'asc' },
    });

    return tasks.map((t) => ({
      taskId: t.id,
      taskNumber: t.taskNumber,
      title: t.title,
      description: t.description,
      status: t.responses[0]?.status || TaskStatus.NOT_STARTED,
      issueText: t.responses[0]?.issueText || null,
    }));
  }

  static async getStatusGrid(professorId: string, sessionId: string) {
    // Verify professor owns this session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId: session.classId },
      orderBy: { rollNo: 'asc' },
      select: { id: true, rollNo: true, name: true },
    });

    // Get all tasks
    const tasks = await prisma.task.findMany({
      where: { sessionId },
      orderBy: { taskNumber: 'asc' },
      select: { id: true, taskNumber: true, title: true, description: true },
    });

    // Get all responses
    const responses = await prisma.taskResponse.findMany({
      where: { task: { sessionId } },
    });

    // Build the grid map: grid[studentId][taskId] = { status, issueText }
    const grid: Record<string, Record<string, { status: string; issueText: string | null }>> = {};
    
    for (const student of students) {
      grid[student.id] = {};
      for (const task of tasks) {
        grid[student.id][task.id] = { status: TaskStatus.NOT_STARTED, issueText: null };
      }
    }

    for (const response of responses) {
      if (grid[response.studentId] && grid[response.studentId][response.taskId]) {
        grid[response.studentId][response.taskId] = {
          status: response.status,
          issueText: response.issueText,
        };
      }
    }

    return {
      students,
      tasks,
      grid,
    };
  }
}
