import { fetchApi } from './api';

export interface TaskItem {
  id: string;
  sessionId?: string;
  taskNumber: number;
  title: string;
  description: string | null;
}

export const taskService = {
  async getTasks(sessionId: string): Promise<TaskItem[]> {
    return fetchApi<TaskItem[]>(`/tasks/session/${sessionId}`);
  },

  async createTask(sessionId: string, title: string, description?: string): Promise<TaskItem> {
    return fetchApi<TaskItem>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ sessionId, title, description }),
    });
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; task: TaskItem }> {
    return fetchApi<{ success: boolean; task: TaskItem }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
