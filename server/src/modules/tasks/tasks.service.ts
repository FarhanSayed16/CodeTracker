import { prisma } from '../../config/database';
import { SessionStatus, TaskStatus } from '../../types/enums';
// import { io } from '../../server'; // We'll handle this in the controller or a dedicated service, but for now just DB ops

export class TasksService {
  static async createTask(professorId: string, sessionId: string, title: string, description?: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot add task to an ended session');
    }

    // Determine the next task number
    const lastTask = await prisma.task.findFirst({
      where: { sessionId },
      orderBy: { taskNumber: 'desc' },
    });
    const taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;

    // Create the task
    const task = await prisma.task.create({
      data: {
        sessionId,
        taskNumber,
        title,
        description,
      },
    });

    // Automatically assign this task to all students CURRENTLY in the session
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId },
    });

    if (participants.length > 0) {
      const taskResponses = participants.map((p) => ({
        taskId: task.id,
        studentId: p.studentId,
        status: TaskStatus.NOT_STARTED,
      }));

      await prisma.taskResponse.createMany({ data: taskResponses });
    }

    return task;
  }

  static async listTasks(professorId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    return prisma.task.findMany({
      where: { sessionId },
      orderBy: { taskNumber: 'asc' },
    });
  }

  static async deleteTask(professorId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { session: { include: { class: true } } },
    });

    if (!task || task.session.class.professorId !== professorId) {
      throw new Error('Task not found or Forbidden');
    }

    if (task.session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot delete task from an ended session');
    }

    const deletedTask = await prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true, task: deletedTask };
  }
}
