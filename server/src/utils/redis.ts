import { Redis } from '@upstash/redis';
import { env } from '../config/env';
import { logger } from './logger';

let redis: Redis | null = null;
let initTried = false;

/** True when Upstash REST credentials are configured. */
export function isRedisEnabled(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedis(): Redis | null {
  if (!isRedisEnabled()) return null;
  if (redis) return redis;
  if (initTried) return null;
  initTried = true;
  try {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
    logger.info('Upstash Redis cache enabled');
    return redis;
  } catch (err) {
    logger.warn({ err }, 'Failed to init Upstash Redis — continuing without cache');
    redis = null;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const value = await client.get<T>(key);
    return value ?? null;
  } catch (err) {
    logger.warn({ err, key }, 'Redis GET failed');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    logger.warn({ err, key }, 'Redis SET failed');
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const client = getRedis();
  if (!client || keys.length === 0) return;
  try {
    await client.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, 'Redis DEL failed');
  }
}

export const CacheKeys = {
  sessionByCode: (code: string) => `session:code:${code.toUpperCase()}`,
  rosterSearch: (classId: string) => `roster:class:${classId}`,
};

export const CacheTTL = {
  sessionByCode: 30,
  rosterSearch: 60,
};
