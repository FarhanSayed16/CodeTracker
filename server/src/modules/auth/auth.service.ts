import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export class AuthService {
  static generateToken(professor: { id: string; email: string; name: string }) {
    return jwt.sign(
      {
        professorId: professor.id,
        email: professor.email,
        name: professor.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  static async register(data: any) {
    const existing = await prisma.professor.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await argon2.hash(data.password);

    const professor = await prisma.professor.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    const token = this.generateToken(professor);

    return {
      token,
      professor: {
        id: professor.id,
        name: professor.name,
        email: professor.email,
      },
    };
  }

  static async login(data: any) {
    const professor = await prisma.professor.findUnique({
      where: { email: data.email },
    });

    if (!professor) {
      throw new Error('Invalid credentials');
    }

    const valid = await argon2.verify(professor.passwordHash, data.password);

    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(professor);

    return {
      token,
      professor: {
        id: professor.id,
        name: professor.name,
        email: professor.email,
      },
    };
  }

  static async getProfile(professorId: string) {
    const professor = await prisma.professor.findUnique({
      where: { id: professorId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!professor) {
      throw new Error('Professor not found');
    }

    return professor;
  }
}
