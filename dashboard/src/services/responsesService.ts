import { fetchApi } from './api';

export interface StudentResponseGrid {
  students: { id: string; rollNo: string; name: string }[];
  tasks: { id: string; taskNumber: number; title: string; description: string | null }[];
  grid: Record<string, Record<string, { status: string; issueText: string | null }>>;
}

export interface IssueItem {
  id: string;
  studentId: string;
  rollNo: string;
  name: string;
  taskId: string;
  taskTitle: string;
  issueText: string;
  updatedAt: string;
}

export const responsesService = {
  async getStatusGrid(sessionId: string): Promise<StudentResponseGrid> {
    return fetchApi<StudentResponseGrid>(`/responses/grid/${sessionId}`);
  },

  async getIssues(sessionId: string): Promise<IssueItem[]> {
    return fetchApi<IssueItem[]>(`/responses/issues/${sessionId}`);
  },

  async resolveIssue(sessionId: string, studentId: string, taskId: string): Promise<void> {
    return fetchApi<void>(`/responses/resolve/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ studentId, taskId }),
    });
  }
};
