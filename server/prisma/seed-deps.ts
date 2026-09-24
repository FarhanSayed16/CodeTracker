import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds Tech University + 3 departments.
 * Also invoked from prisma/seed.ts — prefer `npm run db:seed` for a full reset.
 */
export async function seedInstitutionsAndDepartments(client: PrismaClient = prisma) {
  const institution = await client.institution.create({
    data: { name: 'Tech University' },
  });

  await client.department.createMany({
    data: [
      { name: 'Computer Science', institutionId: institution.id },
      { name: 'Information Technology', institutionId: institution.id },
      { name: 'Electrical Engineering', institutionId: institution.id },
    ],
  });

  const csDepartment = await client.department.findFirst({
    where: { name: 'Computer Science', institutionId: institution.id },
  });

  console.log('Seeded institution: Tech University (3 departments)');
  return { institution, csDepartment };
}

async function main() {
  await seedInstitutionsAndDepartments(prisma);
}

const isDirectRun =
  typeof require !== 'undefined' &&
  require.main === module;

if (isDirectRun) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
