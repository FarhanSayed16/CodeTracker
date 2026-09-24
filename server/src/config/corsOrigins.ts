import { env } from './env';

/** Built-in local UI origins (dashboard + companion Vite). */
const LOCAL_UI_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

/**
 * Parse CORS_ORIGIN (comma-separated). Always includes local dashboard + companion
 * ports so Electron/Vite companions work without a manual .env edit.
 */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.includes('*')) return ['*'];
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
