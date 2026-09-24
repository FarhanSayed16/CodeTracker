import rateLimit, { ipKeyGenerator, type Options, type Store, type ClientRateLimitInfo } from 'express-rate-limit';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getRedis, isRedisEnabled } from '../utils/redis';

/**
 * Classroom-safe keying: authenticated users get their own bucket;
 * unauthenticated traffic keys by IP (IPv6-safe).
 */
function classroomKeyGenerator(req: Request): string {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.decode(header.slice(7)) as {
        professorId?: string;
        studentId?: string;
      } | null;
      if (payload?.professorId) return `prof:${payload.professorId}`;
      if (payload?.studentId) return `stu:${payload.studentId}`;
    } catch {
      /* fall through */
    }
  }
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown');
}

const skipInTest = () => process.env.NODE_ENV === 'test';

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests. Please wait a moment and try again.',
  });
};

/**
 * Express-rate-limit store backed by Upstash Redis.
 * Falls through when Redis is unavailable (caller uses MemoryStore default).
 */
class UpstashRateLimitStore implements Store {
  prefix: string;
  windowMs = 60_000;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string) {
    return `rl:${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const client = getRedis();
    if (!client) {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
    const redisKey = this.key(key);
    const totalHits = await client.incr(redisKey);
    if (totalHits === 1) {
      await client.pexpire(redisKey, this.windowMs);
    }
    const pttl = await client.pttl(redisKey);
    const resetTime = new Date(Date.now() + (pttl > 0 ? pttl : this.windowMs));
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;
    await client.decr(this.key(key));
  }

  async resetKey(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;
    await client.del(this.key(key));
  }
}

function buildLimiter(
  prefix: string,
  windowMs: number,
  max: number,
  keyGenerator: Options['keyGenerator'],
  extra: Partial<Options> = {}
) {
  const options: Partial<Options> = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: rateLimitHandler,
    skip: skipInTest,
    ...extra,
  };
  if (isRedisEnabled()) {
    options.store = new UpstashRateLimitStore(prefix);
  }
  return rateLimit(options as Options);
}

export const apiLimiter = buildLimiter(
  'api',
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX,
  classroomKeyGenerator,
  {
    skip: (req) => skipInTest() || req.path === '/health' || req.path === '/api/health',
  }
);

export const authLimiter = buildLimiter(
  'auth',
  env.AUTH_RATE_LIMIT_WINDOW_MS,
  env.AUTH_RATE_LIMIT_MAX,
  (req) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown'),
  { skipSuccessfulRequests: true }
);

export const studentJoinLimiter = buildLimiter(
  'student',
  env.RATE_LIMIT_WINDOW_MS,
  env.STUDENT_RATE_LIMIT_MAX,
  (req) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown')
);
