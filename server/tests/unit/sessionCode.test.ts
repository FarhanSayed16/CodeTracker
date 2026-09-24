import { generateUniqueSessionCode } from '../../src/utils/sessionCode';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
    },
  },
}));

describe('sessionCode util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a 6-character code on the first try if unique', async () => {
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

    const code = await generateUniqueSessionCode();
    expect(code).toHaveLength(6);
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(1);
    expect(typeof code).toBe('string');
  });

  it('retries if code already exists', async () => {
    // Return existing session on first call, then null on second call
    (prisma.session.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'existing-session' })
      .mockResolvedValueOnce(null);

    const code = await generateUniqueSessionCode();
    expect(code).toHaveLength(6);
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it('throws an error if it fails 10 times', async () => {
    // Always return existing session
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-session' });

    await expect(generateUniqueSessionCode()).rejects.toThrow('Failed to generate a unique session code after 10 attempts');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(10);
  });
});
