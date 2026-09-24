import type { CompanionConfig, Role } from './types';

export type LockedRole = 'student' | 'professor' | null;

export interface CompanionRuntime {
  lockedRole: LockedRole;
  allowSwitchRole: boolean;
  productLabel: string;
  ballLabel: string;
  isPackaged: boolean;
}

const BROWSER_DEV_RUNTIME: CompanionRuntime = {
  lockedRole: null,
  allowSwitchRole: true,
  productLabel: 'CodeTrack Companion',
  ballLabel: 'CT',
  isPackaged: false,
};

let runtime: CompanionRuntime = { ...BROWSER_DEV_RUNTIME };

/** Optional URL override for browser testing: ?role=student|professor */
function roleFromQuery(): LockedRole {
  if (typeof window === 'undefined') return null;
  try {
    const r = new URLSearchParams(window.location.search).get('role');
    if (r === 'student' || r === 'professor') return r;
  } catch {
    /* ignore */
  }
  return null;
}

export async function initRuntime(): Promise<CompanionRuntime> {
  const fromElectron = (await window.companion?.getRuntime?.()) || null;
  const queryLock = roleFromQuery();

  if (fromElectron) {
    runtime = {
      ...fromElectron,
      // Query can force lock in unlocked Electron/dev builds for QA
      lockedRole: fromElectron.lockedRole || queryLock,
      allowSwitchRole: fromElectron.lockedRole ? false : !queryLock,
    };
  } else if (queryLock) {
    runtime = {
      lockedRole: queryLock,
      allowSwitchRole: false,
      productLabel: queryLock === 'student' ? 'CodeTrack Student' : 'CodeTrack Lab Monitor',
      ballLabel: queryLock === 'student' ? 'STU' : 'PROF',
      isPackaged: false,
    };
  } else {
    runtime = { ...BROWSER_DEV_RUNTIME };
  }

  return runtime;
}

export function getRuntime(): CompanionRuntime {
  return runtime;
}

export function resolveInitialRole(stored: Role): Role {
  if (runtime.lockedRole) return runtime.lockedRole;
  return stored;
}
