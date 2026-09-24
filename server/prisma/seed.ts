import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { seedInstitutionsAndDepartments } from './seed-deps';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (order respects FKs)
  await prisma.taskResponse.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.task.deleteMany();
  await prisma.session.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.institution.deleteMany();

  console.log('Seeding Database...');

  const { csDepartment } = await seedInstitutionsAndDepartments(prisma);

  const passwordHash = await argon2.hash('password123');
  const professor = await prisma.professor.create({
    data: {
      name: 'Dr. John Doe',
      email: 'john.doe@example.com',
      passwordHash,
      departmentId: csDepartment?.id,
    },
  });

  console.log(
    `Created Professor: ${professor.name} (john.doe@example.com / password123) → Computer Science`
  );

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

  // Global students enrolled into class A
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.student.create({
      data: {
        rollNo: `170309260${i.toString().padStart(2, '0')}`,
        name: `Student A${i}`,
        membershipId: `17202609${i.toString().padStart(2, '0')}`,
      },
    });
    await prisma.classEnrollment.create({
      data: { classId: classA.id, studentId: student.id },
    });
  }

  // Class B students + one shared student also enrolled in A (cross-class)
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.student.create({
      data: {
        rollNo: `170309261${i.toString().padStart(2, '0')}`,
        name: `Student B${i}`,
      },
    });
    await prisma.classEnrollment.create({
      data: { classId: classB.id, studentId: student.id },
    });
  }

  // Enroll first Class A student into Class B as well (cross-class demo)
  const shared = await prisma.student.findFirst({
    where: { rollNo: '17030926001' },
  });
  if (shared) {
    await prisma.classEnrollment.create({
      data: { classId: classB.id, studentId: shared.id },
    });
  }

  console.log('Created 20 students + 1 cross-class enrollment');
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
