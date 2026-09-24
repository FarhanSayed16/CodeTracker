import type { CompanionConfig, Role, StudentSession } from './types';

const KEYS = {
  role: 'ct_role',
  apiUrl: 'ct_api_url',
  socketUrl: 'ct_socket_url',
  dashboardUrl: 'ct_dashboard_url',
  professorToken: 'ct_prof_token',
  professorEmail: 'ct_prof_email',
  student: 'ct_student_session',
  muted: 'ct_muted',
  sessionId: 'ct_prof_session_id',
} as const;

export function loadConfigOverrides(): Partial<CompanionConfig> {
  return {
    apiUrl: localStorage.getItem(KEYS.apiUrl) || undefined,
    socketUrl: localStorage.getItem(KEYS.socketUrl) || undefined,
    dashboardUrl: localStorage.getItem(KEYS.dashboardUrl) || undefined,
  };
}

export function saveConfig(cfg: CompanionConfig) {
  localStorage.setItem(KEYS.apiUrl, cfg.apiUrl);
  localStorage.setItem(KEYS.socketUrl, cfg.socketUrl);
  localStorage.setItem(KEYS.dashboardUrl, cfg.dashboardUrl);
}

export function getRole(): Role {
  const r = localStorage.getItem(KEYS.role);
  if (r === 'professor' || r === 'student') return r;
  return null;
}

export function setRole(role: Role) {
  if (role) localStorage.setItem(KEYS.role, role);
  else localStorage.removeItem(KEYS.role);
}

export function getProfessorToken(): string | null {
  return localStorage.getItem(KEYS.professorToken);
}

export function setProfessorToken(token: string | null, email?: string) {
  if (token) {
    localStorage.setItem(KEYS.professorToken, token);
    if (email) localStorage.setItem(KEYS.professorEmail, email);
  } else {
    localStorage.removeItem(KEYS.professorToken);
    localStorage.removeItem(KEYS.professorEmail);
    localStorage.removeItem(KEYS.sessionId);
  }
}

export function getProfessorEmail(): string | null {
  return localStorage.getItem(KEYS.professorEmail);
}

export function getProfessorSessionId(): string | null {
  return localStorage.getItem(KEYS.sessionId);
}

export function setProfessorSessionId(id: string | null) {
  if (id) localStorage.setItem(KEYS.sessionId, id);
  else localStorage.removeItem(KEYS.sessionId);
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(KEYS.student);
    return raw ? (JSON.parse(raw) as StudentSession) : null;
  } catch {
    return null;
  }
}

export function setStudentSession(session: StudentSession | null) {
  if (session) localStorage.setItem(KEYS.student, JSON.stringify(session));
  else localStorage.removeItem(KEYS.student);
}

export function isMuted(): boolean {
  return localStorage.getItem(KEYS.muted) === '1';
}

export function setMuted(muted: boolean) {
  localStorage.setItem(KEYS.muted, muted ? '1' : '0');
}
