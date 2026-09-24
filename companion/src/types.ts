export type Role = 'professor' | 'student' | null;

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'ISSUE';

export interface CompanionConfig {
  apiUrl: string;
  socketUrl: string;
  dashboardUrl: string;
}

export interface StudentTask {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  localStatus: TaskStatus;
  localIssueText: string;
  localDoneTimestamp: number | null;
}

export interface StudentSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionTitle: string;
  sessionCode: string;
  token: string;
}

export interface ProfessorSession {
  id: string;
  title: string;
  code: string;
  status: string;
  class?: { name: string };
  _count?: { responses: number; tasks: number };
}

export interface GridStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  statuses: Record<string, { status: TaskStatus; issueText?: string | null }>;
}

export interface GridTask {
  id: string;
  title: string;
  order: number;
}

export interface IssueItem {
  studentId: string;
  studentName: string;
  taskId: string;
  taskTitle: string;
  issueText: string;
  timestamp: number;
}

declare global {
  interface Window {
    companion?: {
      setExpanded: (expanded: boolean) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      getConfig: () => Promise<CompanionConfig>;
      getRuntime: () => Promise<{
        lockedRole: 'student' | 'professor' | null;
        allowSwitchRole: boolean;
        productLabel: string;
        ballLabel: string;
        isPackaged: boolean;
      }>;
    };
  }
}
