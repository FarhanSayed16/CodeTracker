export interface Class {
  id: string;
  className: string;
  createdAt: string;
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

export interface Session {
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
