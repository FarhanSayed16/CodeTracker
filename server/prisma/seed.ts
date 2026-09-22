import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.taskResponse.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.task.deleteMany();
  await prisma.session.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.professor.deleteMany();

  console.log('Seeding Database...');

  // Create Professor
  const passwordHash = await argon2.hash('password123');
  const professor = await prisma.professor.create({
    data: {
      name: 'Dr. John Doe',
      email: 'john.doe@example.com',
      passwordHash,
    },
  });

  console.log(`Created Professor: ${professor.name} (john.doe@example.com / password123)`);

  // Create Classes
  const classA = await prisma.class.create({
    data: {
      className: 'TY-CS-A',
      professorId: professor.id,
    },
  });

  const classB = await prisma.class.create({
    data: {
      className: 'SY-CS-B',
      professorId: professor.id,
    },
  });

  console.log(`Created Classes: ${classA.className}, ${classB.className}`);

  // Create Students for Class A
  const studentsA = [];
  for (let i = 1; i <= 10; i++) {
    studentsA.push({
      rollNo: `A${i.toString().padStart(2, '0')}`,
      name: `Student A${i}`,
      classId: classA.id,
    });
  }
  await prisma.student.createMany({ data: studentsA });

  // Create Students for Class B
  const studentsB = [];
  for (let i = 1; i <= 10; i++) {
    studentsB.push({
      rollNo: `B${i.toString().padStart(2, '0')}`,
      name: `Student B${i}`,
      classId: classB.id,
    });
  }
  await prisma.student.createMany({ data: studentsB });

  console.log('Created 10 students for each class');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
