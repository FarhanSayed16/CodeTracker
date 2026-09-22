import { customAlphabet } from 'nanoid';
import { SESSION_CODE_ALPHABET } from '../config/constants';
import { prisma } from '../config/database';
import { SessionStatus } from '../types/enums';

const generateCode = customAlphabet(SESSION_CODE_ALPHABET, 6);

export async function generateUniqueSessionCode(): Promise<string> {
  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = generateCode();
    const existing = await prisma.session.findUnique({
      where: { sessionCode: code },
    });
    
    // We only care if it's currently active. An ended session's code could theoretically be reused,
    // but the DB constraint requires it to be strictly unique globally. 
    // Wait, the DB schema has `@unique` on sessionCode, so it must be globally unique.
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique session code after 10 attempts');
  }

  return code;
}
