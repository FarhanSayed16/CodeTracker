import { AuthService } from '../../src/modules/auth/auth.service';
import { prisma } from '../../src/config/database';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

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

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock env variables
jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'testsecret',
    JWT_EXPIRES_IN: '1h',
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws error if email already exists', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(AuthService.register({ email: 'test@test.com', password: 'pass', name: 'Test' }))
        .rejects.toThrow('Email already registered');
    });

    it('hashes password and creates professor', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashedpass');
      (prisma.professor.create as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'Test Prof',
        email: 'test@test.com',
      });
      (jwt.sign as jest.Mock).mockReturnValue('mockedtoken');

      const result = await AuthService.register({ email: 'test@test.com', password: 'pass', name: 'Test Prof' });

      expect(argon2.hash).toHaveBeenCalledWith('pass');
      expect(prisma.professor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Prof',
          email: 'test@test.com',
          passwordHash: 'hashedpass',
        },
      });
      expect(result.token).toBe('mockedtoken');
      expect(result.professor.id).toBe('123');
    });
  });

  describe('login', () => {
    it('throws error on invalid email', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login({ email: 'wrong@test.com', password: 'pass' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('throws error on invalid password', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        passwordHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.login({ email: 'test@test.com', password: 'wrongpass' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('returns token and profile on success', async () => {
      (prisma.professor.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'Test Prof',
        email: 'test@test.com',
        passwordHash: 'hash',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockedtoken');

      const result = await AuthService.login({ email: 'test@test.com', password: 'rightpass' });

      expect(argon2.verify).toHaveBeenCalledWith('hash', 'rightpass');
      expect(result.token).toBe('mockedtoken');
      expect(result.professor.name).toBe('Test Prof');
    });
  });
});
