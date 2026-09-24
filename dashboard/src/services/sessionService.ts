import { fetchApi } from './api';

export interface SessionItem {
  id: string;
  classId: string;
  sessionCode: string;
  title: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt: string | null;
  class?: {
    id: string;
    className: string;
  };
  _count?: {
    participants: number;
    tasks: number;
  };
}

export const sessionService = {
  async getSessions(classId: string): Promise<SessionItem[]> {
    return fetchApi<SessionItem[]>(`/sessions/class/${classId}`);
  },

  async getAllSessions(status?: 'ACTIVE' | 'ENDED'): Promise<SessionItem[]> {
    const query = status ? `?status=${status}` : '';
    return fetchApi<SessionItem[]>(`/sessions${query}`);
  },

  async createSession(classId: string, title: string): Promise<SessionItem> {
    return fetchApi<SessionItem>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ classId, title }),
    });
  },

  async getSession(sessionId: string): Promise<SessionItem> {
    return fetchApi<SessionItem>(`/sessions/${sessionId}`);
  },

  async endSession(sessionId: string): Promise<SessionItem> {
    return fetchApi<SessionItem>(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },
};
