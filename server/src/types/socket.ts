import { TaskStatus } from './enums';

export interface ServerToClientEvents {
  'session-ended': () => void;
  'student-joined': (data: { studentId: string; rollNo: string; name: string }) => void;
  'new-task': (data: { taskId: string; taskNumber: number; title: string; description: string | null }) => void;
  'task-removed': (data: { taskId: string }) => void;
  'status-update': (data: {
    studentId: string;
    rollNo: string;
    name: string;
    taskId: string;
    status: TaskStatus;
    issueText: string | null;
  }) => void;
}

export interface ClientToServerEvents {
  // We'll define these if students send events directly, but mostly we'll use REST for commands
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  role: 'professor' | 'student';
  sessionId?: string; // Only for students
}
