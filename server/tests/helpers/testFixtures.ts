import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/** Shared helper for tests that need a clean DB (use with care — destructive). */
export async function resetCoreTables(prisma: PrismaClient) {
  await prisma.taskResponse.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.task.deleteMany();
  await prisma.session.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.professor.deleteMany();
}

export async function createTestProfessor(
  prisma: PrismaClient,
  overrides?: Partial<{ name: string; email: string; password: string }>
) {
  const password = overrides?.password ?? 'password123';
  const passwordHash = await argon2.hash(password);
  const professor = await prisma.professor.create({
    data: {
      name: overrides?.name ?? 'Test Professor',
      email: overrides?.email ?? `prof_${Date.now()}@test.com`,
      passwordHash,
    },
  });
  return { professor, password };
}
