import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { seedInstitutionsAndDepartments } from './seed-deps';

const prisma = new PrismaClient();

type ParsedStudentRow = { rollNo: string; name: string; membershipId?: string };

function normalizeCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(Math.trunc(value));
  }
  return String(value).trim().replace(/\.0+$/, '');
}

/** Prefer the clean roster sheet; fall back to first sheet. */
function parseRosterFromWorkbook(filePath: string): ParsedStudentRow[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const preferred =
    workbook.SheetNames.find((n) => n.toLowerCase().includes('mca') && !n.toLowerCase().includes('atten')) ||
    workbook.SheetNames[0];
  if (!preferred) throw new Error('Spreadsheet has no sheets.');

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets[preferred], { header: 1 });

  let headerIdx = -1;
  let rollCol = -1;
  let nameCol = -1;
  let memberCol = -1;

  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = (rawData[i] || []) as unknown[];
    let localRoll = -1;
    let localName = -1;
    let localMember = -1;

    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
      if (!cell) continue;
      if (cell.includes('roll') && (cell.includes('no') || cell.includes('number') || cell === 'roll')) {
        localRoll = j;
      }
      if (cell.includes('name')) localName = j;
      if (cell.includes('member') || cell.includes('somaiya')) localMember = j;
    }

    if (localRoll >= 0 && localName >= 0) {
      headerIdx = i;
      rollCol = localRoll;
      nameCol = localName;
      memberCol = localMember;
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error('Could not detect Roll No. / Name columns in attendance sheet.');
  }

  const rows: ParsedStudentRow[] = [];
  const seen = new Set<string>();

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[] | undefined;
    if (!row) continue;
    const rollNo = normalizeCell(row[rollCol]);
    const name = normalizeCell(row[nameCol]);
    const membershipId =
      memberCol >= 0 && row[memberCol] != null && String(row[memberCol]).trim() !== ''
        ? normalizeCell(row[memberCol])
        : undefined;
    if (!rollNo || !name || name.length < 2) continue;
    if (seen.has(rollNo)) continue;
    seen.add(rollNo);
    rows.push({ rollNo, name, membershipId });
  }

  if (rows.length === 0) throw new Error('No student rows found in attendance sheet.');
  return rows;
}

async function main() {
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
      name: 'Sudarshan Sir',
      email: 'sudarshan@gmail.com',
      passwordHash,
      departmentId: csDepartment?.id,
    },
  });

  console.log(`Created Professor: ${professor.name} (sudarshan@gmail.com / password123)`);

  const mcaClass = await prisma.class.create({
    data: {
      className: 'MCA I Sem 2026-28',
      professorId: professor.id,
    },
  });

  const rosterPath = path.join(__dirname, 'data', 'mca-attendance.xlsx');
  if (!fs.existsSync(rosterPath)) {
    throw new Error(`Roster file missing: ${rosterPath}`);
  }

  const students = parseRosterFromWorkbook(rosterPath);
  for (const row of students) {
    const student = await prisma.student.create({
      data: {
        rollNo: row.rollNo,
        name: row.name,
        membershipId: row.membershipId,
      },
    });
    await prisma.classEnrollment.create({
      data: { classId: mcaClass.id, studentId: student.id },
    });
  }

  console.log(`Created class ${mcaClass.className} with ${students.length} students from attendance sheet`);
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
