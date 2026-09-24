import type { CompanionConfig } from './types';
import { loadConfigOverrides, saveConfig } from './storage';

const FALLBACK: CompanionConfig = {
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  dashboardUrl: 'http://localhost:5173',
};

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.companion;
}

/** Drop bad values that break the packaged desktop app (relative /api, Vite ports). */
export function sanitizeUrl(
  kind: 'api' | 'socket' | 'dashboard',
  value: string | undefined | null
): string | undefined {
  if (value == null) return undefined;
  const v = value.trim();
  if (!v) return undefined;

  // Relative paths only work in browser Vite proxy — never in Electron
  if (isElectron() && (v.startsWith('/') || v.startsWith('./'))) return undefined;

  // Common mistake: Config saved while testing companion UI in Chrome on :5174
  if (/:5174(\/|$)/.test(v) && kind !== 'dashboard') return undefined;

  if (kind === 'api') {
    // Ensure /api suffix for absolute hosts that forgot it
    if (/^https?:\/\//i.test(v) && !/\/api\/?$/i.test(v)) {
      return v.replace(/\/$/, '') + '/api';
    }
  }
  return v.replace(/\/$/, '');
}

function browserDevDefaults(): CompanionConfig {
  if (!isElectron() && import.meta.env.DEV) {
    return {
      apiUrl: `${window.location.origin}/api`,
      socketUrl: window.location.origin,
      dashboardUrl: 'http://localhost:5173',
    };
  }
  return { ...FALLBACK };
}

let runtimeConfig: CompanionConfig = browserDevDefaults();

export async function initConfig(): Promise<CompanionConfig> {
  const defaults = browserDevDefaults();
  const fromElectron: Partial<CompanionConfig> = (await window.companion?.getConfig?.()) || {};
  const fromStorage = loadConfigOverrides();

  const apiUrl =
    sanitizeUrl('api', fromStorage.apiUrl) ||
    sanitizeUrl('api', fromElectron.apiUrl) ||
    defaults.apiUrl;
  const socketUrl =
    sanitizeUrl('socket', fromStorage.socketUrl) ||
    sanitizeUrl('socket', fromElectron.socketUrl) ||
    defaults.socketUrl;
  const dashboardUrl =
    sanitizeUrl('dashboard', fromStorage.dashboardUrl) ||
    sanitizeUrl('dashboard', fromElectron.dashboardUrl) ||
    defaults.dashboardUrl;

  runtimeConfig = { apiUrl, socketUrl, dashboardUrl };

  // Heal bad stored config so next launch works without manual Reset
  const storedApi = fromStorage.apiUrl;
  if (storedApi && sanitizeUrl('api', storedApi) !== storedApi) {
    saveConfig(runtimeConfig);
  }

  return runtimeConfig;
}

export function getConfig(): CompanionConfig {
  return runtimeConfig;
}

export function updateConfig(partial: Partial<CompanionConfig>) {
  runtimeConfig = {
    apiUrl: sanitizeUrl('api', partial.apiUrl) || runtimeConfig.apiUrl,
    socketUrl: sanitizeUrl('socket', partial.socketUrl) || runtimeConfig.socketUrl,
    dashboardUrl: sanitizeUrl('dashboard', partial.dashboardUrl) || runtimeConfig.dashboardUrl,
  };
}

export function getDefaultConfig(): CompanionConfig {
  return { ...FALLBACK };
}
