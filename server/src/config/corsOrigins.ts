import { env } from './env';

/** Built-in local UI origins (dashboard + companion Vite) — merged only outside production. */
const LOCAL_UI_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

/**
 * Parse CORS_ORIGIN (comma-separated).
 * Production: only env list (set real HTTPS origins).
 * Development: also allow local dashboard + companion ports.
 */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.includes('*')) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[cors] CORS_ORIGIN=* is unsafe in production — set explicit origins');
    }
    return ['*'];
  }
  if (process.env.NODE_ENV === 'production') {
    return [...new Set(fromEnv)];
  }
  return [...new Set([...fromEnv, ...LOCAL_UI_ORIGINS])];
}

/** cors / socket.io `origin` option: allow list, or reflect any when `*`. */
export function corsOriginOption():
  | boolean
  | string[]
  | ((origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void) {
  const allowed = getAllowedCorsOrigins();
  if (allowed.includes('*')) return true;

  return (origin, callback) => {
    // No Origin = same-origin, curl, Electron file:// / some native clients
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, allowed.includes(origin));
  };
}
