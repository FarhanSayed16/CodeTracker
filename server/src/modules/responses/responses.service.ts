import { prisma } from '../../config/database';
import { TaskStatus } from '../../types/enums';
import { env } from '../../config/env';
import { emitToProfessor, emitToStudents } from '../../socket';

export class ResponsesService {
  static async updateStatus(studentId: string, sessionId: string, taskId: string, status: TaskStatus, issueText?: string | null) {
    // Verify the student is a participant in this session
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_studentId: { sessionId, studentId },
      },
    });
    if (!participant) {
      throw new Error('Student is not a participant in this session');
    }

    // Verify the task belongs to the session
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.sessionId !== sessionId) {
      throw new Error('Task not found in this session');
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Student not found');

    if (status !== TaskStatus.ISSUE) {
      issueText = null;
    }

    const existingResponse = await prisma.taskResponse.findUnique({
      where: { taskId_studentId: { taskId, studentId } }
    });

    if (existingResponse && existingResponse.status === TaskStatus.DONE && status !== TaskStatus.DONE) {
      const graceWindow = env.GRACE_WINDOW_SECONDS * 1000;
      const timeSinceUpdate = Date.now() - existingResponse.updatedAt.getTime();
      if (timeSinceUpdate > graceWindow) {
        throw new Error('Grace window expired. Cannot change status from DONE.');
      }
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

    emitToProfessor(sessionId, 'status-update', {
      id: response.id,
      studentId: student.id,
      rollNo: student.rollNo,
      name: student.name,
      taskId: task.id,
      taskTitle: task.title,
      status: response.status,
      issueText: response.issueText,
      updatedAt: response.updatedAt,
    });

    // Publish aggregated stats to MQTT for IoT hub
    const allResponses = await prisma.taskResponse.findMany({
      where: { task: { sessionId } }
    });
    const studentsCount = await prisma.sessionParticipant.count({ where: { sessionId } });
    const tasksCount = await prisma.task.count({ where: { sessionId } });
    
    let totalDone = 0;
    let totalIssues = 0;
    let totalInProgress = 0;
    
    allResponses.forEach(r => {
      if (r.status === TaskStatus.DONE) totalDone++;
      else if (r.status === TaskStatus.ISSUE) totalIssues++;
      else if (r.status === TaskStatus.IN_PROGRESS) totalInProgress++;
    });

    const mqttClient = require('../../utils/mqttClient');
    mqttClient.publishSessionStatus(sessionId, {
      event: 'status-update',
      stats: {
        done: totalDone,
        issues: totalIssues,
        inProgress: totalInProgress,
        totalTasks: tasksCount,
        totalStudents: studentsCount
      }
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

    // Get students who have joined this session (participants only)
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId },
      include: {
        student: { select: { id: true, rollNo: true, name: true } },
      },
    });

    const students = participants
      .map((p) => p.student)
      .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

    // Get all tasks
    const tasks = await prisma.task.findMany({
      where: { sessionId },
      orderBy: { taskNumber: 'asc' },
      select: { id: true, taskNumber: true, title: true, description: true },
    });

    // Get all responses for participants in this session
    const studentIds = students.map((s) => s.id);
    const responses = await prisma.taskResponse.findMany({
      where: {
        task: { sessionId },
        studentId: { in: studentIds },
      },
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

  static async getIssues(professorId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    const issues = await prisma.taskResponse.findMany({
      where: {
        task: { sessionId },
        status: TaskStatus.ISSUE,
      },
      include: {
        student: { select: { id: true, rollNo: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return issues.map(issue => ({
      id: issue.id,
      studentId: issue.studentId,
      rollNo: issue.student.rollNo,
      name: issue.student.name,
      taskId: issue.taskId,
      taskTitle: issue.task.title,
      issueText: issue.issueText,
      updatedAt: issue.updatedAt,
    }));
  }
  static async resolveIssue(professorId: string, sessionId: string, studentId: string, taskId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { class: true },
    });

    if (!session || session.class.professorId !== professorId) {
      throw new Error('Session not found or Forbidden');
    }

    const response = await prisma.taskResponse.update({
      where: {
        taskId_studentId: {
          taskId,
          studentId,
        },
      },
      data: {
        status: TaskStatus.IN_PROGRESS,
        issueText: null,
      },
    });

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (student && task) {
      emitToProfessor(sessionId, 'status-update', {
        id: response.id,
        studentId: student.id,
        rollNo: student.rollNo,
        name: student.name,
        taskId: task.id,
        taskTitle: task.title,
        status: response.status,
        issueText: response.issueText,
        updatedAt: response.updatedAt,
      });

      emitToStudents(sessionId, 'status-resolved', {
        studentId,
        taskId,
        status: response.status
      });
      
      const allResponses = await prisma.taskResponse.findMany({
        where: { task: { sessionId } }
      });
      const studentsCount = await prisma.sessionParticipant.count({ where: { sessionId } });
      const tasksCount = await prisma.task.count({ where: { sessionId } });
      
      let totalDone = 0;
      let totalIssues = 0;
      let totalInProgress = 0;
      
      allResponses.forEach(r => {
        if (r.status === TaskStatus.DONE) totalDone++;
        else if (r.status === TaskStatus.ISSUE) totalIssues++;
        else if (r.status === TaskStatus.IN_PROGRESS) totalInProgress++;
      });
  
      const mqttClient = require('../../utils/mqttClient');
      mqttClient.publishSessionStatus(sessionId, {
        event: 'status-update',
        stats: {
          done: totalDone,
          issues: totalIssues,
          inProgress: totalInProgress,
          totalTasks: tasksCount,
          totalStudents: studentsCount
        }
      });
    }

    return response;
  }
}
