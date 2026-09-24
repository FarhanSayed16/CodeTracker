import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { env } from '../../src/config/env';

jest.mock('../../src/config/database', () => ({
  prisma: {
    professor: { findUnique: jest.fn() },
    class: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    classEnrollment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskResponse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    sessionParticipant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/socket', () => ({
  emitToStudents: jest.fn(),
  emitToProfessor: jest.fn(),
  emitToSession: jest.fn(),
  getIO: jest.fn(),
  initSocket: jest.fn(),
}));

jest.mock('../../src/utils/mqttClient', () => ({
  publishSessionStatus: jest.fn(),
  initMqtt: jest.fn(),
}));

const profId = 'a1111111-1111-4111-8111-111111111111';
const classId = 'a2222222-2222-4222-8222-222222222222';
const sessionId = 'a3333333-3333-4333-8333-333333333333';
const taskId = 'a4444444-4444-4444-8444-444444444444';
const studentId = 'a5555555-5555-4555-8555-555555555555';

function authToken() {
  return jwt.sign({ professorId: profId, email: 'p@test.com', name: 'Prof' }, env.JWT_SECRET);
}

function studentToken() {
  return jwt.sign(
    { studentId, sessionId, rollNo: '17030926044', name: 'Alice' },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

describe('Classes / Sessions / Responses API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.professor.findUnique as jest.Mock).mockResolvedValue({
      id: profId,
      email: 'p@test.com',
      name: 'Prof',
    });
  });

  describe('Classes', () => {
    it('POST /api/classes creates a class', async () => {
      (prisma.class.create as jest.Mock).mockResolvedValue({
        id: classId,
        className: 'TY-CS-A',
        professorId: profId,
      });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ className: 'TY-CS-A' });

      expect(res.status).toBe(201);
      expect(res.body.data.className).toBe('TY-CS-A');
    });

    it('POST /api/classes rejects missing className', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ name: 'wrong-field' });

      expect(res.status).toBe(400);
    });

    it('GET /api/classes lists classes for professor', async () => {
      (prisma.class.findMany as jest.Mock).mockResolvedValue([
        { id: classId, className: 'TY-CS-A', _count: { enrollments: 10, sessions: 1 } },
      ]);

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/classes/:id never returns pinHash', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        className: 'TY-CS-A',
        professorId: profId,
        enrollments: [
          {
            id: 'enr-1',
            enrolledAt: new Date(),
            student: {
              id: studentId,
              rollNo: '17030926044',
              name: 'Sayed Farhan',
              membershipId: '1720261116',
              pinHash: 'secret-hash-should-not-leak',
              _count: { enrollments: 2 },
            },
          },
        ],
        sessions: [],
        _count: { sessions: 0, enrollments: 1 },
      });

      const res = await request(app)
        .get(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students[0].hasPin).toBe(true);
      expect(res.body.data.students[0].pinHash).toBeUndefined();
      expect(res.body.data.students[0].enrollmentCount).toBe(2);
      expect(JSON.stringify(res.body)).not.toContain('secret-hash');
    });
  });

  describe('Sessions', () => {
    it('POST /api/sessions creates session with code', async () => {
      (prisma.class.findUnique as jest.Mock).mockResolvedValue({
        id: classId,
        professorId: profId,
      });
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        id: sessionId,
        classId,
        title: 'Lab 1',
        sessionCode: 'ABC123',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ classId, title: 'Lab 1' });

      expect(res.status).toBe(201);
      expect(res.body.data.sessionCode).toBeDefined();
    });

    it('GET /api/sessions/:code/students masks roll numbers', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        classId,
        status: 'ACTIVE',
      });
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          student: {
            id: studentId,
            rollNo: '17030926044',
            name: 'Sayed Farhan Faizan',
            pinHash: null,
          },
        },
      ]);

      const res = await request(app).get('/api/sessions/ABC123/students?q=farhan');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].rollNo).toBe('********044');
      expect(res.body.data[0].hasPin).toBe(false);
      expect(res.body.data[0].name).toBe('Sayed Farhan Faizan');
    });

    it('POST /api/sessions/join requires PIN on first join when enforced', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        sessionCode: 'ABC123',
        status: 'ACTIVE',
        classId,
        class: { id: classId },
        title: 'Lab 1',
      });
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        id: studentId,
        rollNo: '17030926044',
        name: 'Alice',
        pinHash: null,
        pinAttempts: 0,
        pinLockedAt: null,
      });
      (prisma.classEnrollment.findUnique as jest.Mock).mockResolvedValue({
        classId,
        studentId,
      });

      const res = await request(app)
        .post('/api/sessions/join')
        .send({ sessionCode: 'ABC123', studentId });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/PIN required/i);
    });

    it('POST /api/sessions/join sets PIN and joins on first time', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        sessionCode: 'ABC123',
        status: 'ACTIVE',
        classId,
        class: { id: classId },
        title: 'Lab 1',
      });
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        id: studentId,
        rollNo: '17030926044',
        name: 'Alice',
        pinHash: null,
        pinAttempts: 0,
        pinLockedAt: null,
      });
      (prisma.classEnrollment.findUnique as jest.Mock).mockResolvedValue({
        classId,
        studentId,
      });
      (prisma.student.update as jest.Mock).mockResolvedValue({});
      (prisma.sessionParticipant.upsert as jest.Mock).mockResolvedValue({});
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .post('/api/sessions/join')
        .send({ sessionCode: 'ABC123', studentId, pin: '1234' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(prisma.student.update).toHaveBeenCalled();
    });

    it('POST /api/sessions/join verifies existing PIN', async () => {
      const pinHash = await argon2.hash('5678');
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        sessionCode: 'ABC123',
        status: 'ACTIVE',
        classId,
        class: { id: classId },
        title: 'Lab 1',
      });
      (prisma.student.findUnique as jest.Mock).mockResolvedValue({
        id: studentId,
        rollNo: '17030926044',
        name: 'Alice',
        pinHash,
        pinAttempts: 0,
        pinLockedAt: null,
      });
      (prisma.classEnrollment.findUnique as jest.Mock).mockResolvedValue({
        classId,
        studentId,
      });
      (prisma.sessionParticipant.upsert as jest.Mock).mockResolvedValue({});
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      const bad = await request(app)
        .post('/api/sessions/join')
        .send({ sessionCode: 'ABC123', studentId, pin: '0000' });
      expect(bad.status).toBe(401);

      const good = await request(app)
        .post('/api/sessions/join')
        .send({ sessionCode: 'ABC123', studentId, pin: '5678' });
      expect(good.status).toBe(200);
      expect(good.body.data.token).toBeDefined();
    });
  });

  describe('Tasks', () => {
    it('POST /api/tasks creates a task for an active session', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        status: 'ACTIVE',
        class: { id: classId, professorId: profId },
      });
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: taskId,
        sessionId,
        taskNumber: 1,
        title: 'DOM Selectors',
        description: null,
      });
      (prisma.classEnrollment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.sessionParticipant.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ sessionId, title: 'DOM Selectors' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('DOM Selectors');
      expect(res.body.data.taskNumber).toBe(1);
    });

    it('GET /api/tasks/session/:sessionId lists tasks with status counts', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        status: 'ACTIVE',
        class: { id: classId, professorId: profId },
      });
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          id: taskId,
          sessionId,
          taskNumber: 1,
          title: 'DOM Selectors',
          responses: [{ status: 'DONE' }, { status: 'ISSUE' }, { status: 'NOT_STARTED' }],
        },
      ]);

      const res = await request(app)
        .get(`/api/tasks/session/${sessionId}`)
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].statusCounts).toEqual({
        not_started: 1,
        in_progress: 0,
        done: 1,
        issue: 1,
      });
    });
  });

  describe('Responses', () => {
    beforeEach(() => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        status: 'ACTIVE',
      });
    });

    it('rejects ISSUE without issueText', async () => {
      const res = await request(app)
        .post('/api/responses/status')
        .set('Authorization', `Bearer ${studentToken()}`)
        .send({ taskId, status: 'ISSUE' });

      expect(res.status).toBe(400);
    });

    it('rejects COMPLETED status (must be DONE)', async () => {
      const res = await request(app)
        .post('/api/responses/status')
        .set('Authorization', `Bearer ${studentToken()}`)
        .send({ taskId, status: 'COMPLETED' });

      expect(res.status).toBe(400);
    });
  });
});
