import type { CompanionConfig } from './types';
import { loadConfigOverrides } from './storage';

function browserDevDefaults(): CompanionConfig {
  // Vite proxies /api + /socket.io → :3000 (avoids CORS when opening companion in Chrome)
  if (typeof window !== 'undefined' && !window.companion && import.meta.env.DEV) {
    return {
      apiUrl: `${window.location.origin}/api`,
      socketUrl: window.location.origin,
      dashboardUrl: 'http://localhost:5173',
    };
  }
  return {
    apiUrl: 'http://localhost:3000/api',
    socketUrl: 'http://localhost:3000',
    dashboardUrl: 'http://localhost:5173',
  };
}

let runtimeConfig: CompanionConfig = browserDevDefaults();

export async function initConfig(): Promise<CompanionConfig> {
  const defaults = browserDevDefaults();
  const fromElectron: Partial<CompanionConfig> = (await window.companion?.getConfig?.()) || {};
  const fromStorage = loadConfigOverrides();
  runtimeConfig = {
    apiUrl: fromStorage.apiUrl || fromElectron.apiUrl || defaults.apiUrl,
    socketUrl: fromStorage.socketUrl || fromElectron.socketUrl || defaults.socketUrl,
    dashboardUrl: fromStorage.dashboardUrl || fromElectron.dashboardUrl || defaults.dashboardUrl,
  };
  return runtimeConfig;
}

export function getConfig(): CompanionConfig {
  return runtimeConfig;
}

export function updateConfig(partial: Partial<CompanionConfig>) {
  runtimeConfig = { ...runtimeConfig, ...partial };
}
