import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import * as argon2 from 'argon2';

jest.mock('../../src/config/database', () => ({
  prisma: {
    professor: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('Auth API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 on invalid input', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 201 on success', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hash');
      (prisma.professor.create as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'Test',
        email: 'test@test.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123', name: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and token on valid credentials', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'Test',
        email: 'test@test.com',
        passwordHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 on invalid credentials', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });
});
