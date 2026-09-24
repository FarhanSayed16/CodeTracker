import { prisma } from '../../config/database';
import { SessionStatus, TaskStatus } from '../../types/enums';
import { emitToProfessor, emitToStudents } from '../../socket';

function taskLivePayload(task: { id: string; taskNumber: number; title: string; description: string | null }) {
  return {
    id: task.id,
    taskId: task.id,
    taskNumber: task.taskNumber,
    title: task.title,
    description: task.description,
  };
}

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

    const lastTask = await prisma.task.findFirst({
      where: { sessionId },
      orderBy: { taskNumber: 'desc' },
    });
    const taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;

    const task = await prisma.task.create({
      data: {
        sessionId,
        taskNumber,
        title,
        description,
      },
    });

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

    const payload = taskLivePayload(task);
    emitToStudents(sessionId, 'new-task', payload);
    // Professors listen on professor room (companion live strip / dashboard)
    emitToProfessor(sessionId, 'new-task', payload);

    const mqttClient = require('../../utils/mqttClient');
    mqttClient.publishSessionStatus(sessionId, {
      event: 'new-task',
      task: {
        id: task.id,
        title: task.title,
        taskNumber: task.taskNumber,
      },
    });

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

    const tasks = await prisma.task.findMany({
      where: { sessionId },
      orderBy: { taskNumber: 'asc' },
      include: { responses: { select: { status: true } } },
    });

    return tasks.map(({ responses, ...task }) => {
      const counts = {
        not_started: 0,
        in_progress: 0,
        done: 0,
        issue: 0,
      };
      for (const r of responses) {
        if (r.status === TaskStatus.DONE) counts.done++;
        else if (r.status === TaskStatus.ISSUE) counts.issue++;
        else if (r.status === TaskStatus.IN_PROGRESS) counts.in_progress++;
        else counts.not_started++;
      }
      return { ...task, statusCounts: counts };
    });
  }

  static async updateTask(professorId: string, taskId: string, title?: string, description?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { session: { include: { class: true } } },
    });

    if (!task || task.session.class.professorId !== professorId) {
      throw new Error('Task not found or Forbidden');
    }

    if (task.session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot update task in an ended session');
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return updatedTask;
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

    const removed = { taskId };
    emitToStudents(task.sessionId, 'task-removed', removed);
    emitToProfessor(task.sessionId, 'task-removed', removed);

    return { success: true, task: deletedTask };
  }
}
