import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const boolFromEnv = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .default(defaultValue ? 'true' : 'false')
    .transform((val) => val !== 'false' && val !== '0');

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** Direct (non-pooler) Postgres URL for migrations. Falls back to DATABASE_URL. */
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  /** Student join tokens — default 4h for 3–3.5h classroom labs. */
  STUDENT_JWT_EXPIRES_IN: z.string().default('4h'),
  /** Comma-separated browser origins. Companion (5174) is also merged in corsOrigins. */
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default('3000').transform((val) => parseInt(val, 10)),
  STUDENT_RATE_LIMIT_MAX: z.string().default('2000').transform((val) => parseInt(val, 10)),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  AUTH_RATE_LIMIT_MAX: z.string().default('40').transform((val) => parseInt(val, 10)),
  GRACE_WINDOW_SECONDS: z.string().default('120').transform((val) => parseInt(val, 10)),
  REQUIRE_STUDENT_PIN: boolFromEnv(true),
  /** IoT bridge — keep false until hardware hubs are attached. */
  ENABLE_MQTT: boolFromEnv(false),
  MQTT_URL: z.string().optional().default('mqtt://localhost:1883'),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  /** Upstash Redis REST (optional). When unset, cache/rate-limit use memory. */
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

const data = _env.data;

// Prisma requires DIRECT_URL when schema declares it — default to DATABASE_URL
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = data.DATABASE_URL;
}

export const env = {
  ...data,
  DIRECT_URL: data.DIRECT_URL || data.DATABASE_URL,
};
