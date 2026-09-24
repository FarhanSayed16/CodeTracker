import { getConfig } from './config';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function friendlyNetworkError(err: unknown, apiUrl: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return new ApiError(
      `Cannot reach API at ${apiUrl}. Start the server and check Config (CORS / URL).`,
      0
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const { apiUrl } = getConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });
  } catch (err) {
    throw friendlyNetworkError(err, apiUrl);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || body.message || `Request failed (${res.status})`, res.status);
  }
  return (body.data !== undefined ? body.data : body) as T;
}

export const login = (email: string, password: string) =>
  request<{ token: string; professor: { id: string; name: string; email: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );

export const listSessions = (token: string, status = 'ACTIVE') =>
  request<
    {
      id: string;
      title: string;
      sessionCode: string;
      status: string;
      class?: { name: string };
      _count?: { participants: number; tasks: number };
    }[]
  >(`/sessions?status=${status}`, {}, token);

export const getSession = (token: string, sessionId: string) =>
  request<{
    id: string;
    title: string;
    sessionCode: string;
    status: string;
    class?: { name: string };
    participants?: unknown[];
    tasks?: { id: string; title: string; taskNumber: number }[];
    statusCounts?: {
      not_started: number;
      in_progress: number;
      done: number;
      issue: number;
    };
    _count?: { participants: number; tasks: number };
  }>(`/sessions/${sessionId}`, {}, token);

export const endSession = (token: string, sessionId: string) =>
  request(`/sessions/${sessionId}/end`, { method: 'POST' }, token);

export const getResponseGrid = (token: string, sessionId: string) =>
  request<{
    students: { id: string; name: string; rollNo: string }[];
    tasks: { id: string; title: string; taskNumber: number }[];
    grid: Record<string, Record<string, { status: string; issueText: string | null }>>;
  }>(`/responses/grid/${sessionId}`, {}, token);

export const searchStudents = (code: string, q: string) =>
  request<{ id: string; name: string; rollNumber?: string; rollNo?: string; hasPin: boolean }[]>(
    `/sessions/${encodeURIComponent(code)}/students?q=${encodeURIComponent(q)}`
  );

export const joinSession = (body: { sessionCode: string; studentId: string; pin: string }) =>
  request<{
    token: string;
    session: { id: string; title: string; sessionCode: string; status: string };
    student: { id: string; name: string };
    tasks: { id: string; title: string; description?: string | null; taskNumber?: number }[];
  }>('/sessions/join', { method: 'POST', body: JSON.stringify(body) });

export const restoreStudent = (token: string) =>
  request<{
    session: { id: string; title: string; sessionCode: string; status: string };
    student: { id: string; name: string };
    tasks: { id: string; title: string; description?: string | null; taskNumber?: number }[];
    responses: { taskId: string; status: string; issueText?: string | null }[];
  }>('/sessions/student/restore', {}, token);

export const updateStatus = (
  token: string,
  body: { sessionId: string; taskId: string; status: string; issueText?: string }
) => request('/responses/status', { method: 'POST', body: JSON.stringify(body) }, token);
