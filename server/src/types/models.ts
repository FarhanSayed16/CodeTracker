export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionResponse {
  id: string;
  sessionCode: string;
  title: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  classId: string;
}

export interface TaskResponseDto {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
}

export interface StatusGridResponse {
  students: {
    id: string;
    rollNo: string;
    name: string;
  }[];
  tasks: TaskResponseDto[];
  grid: Record<string, Record<string, { status: string; issueText: string | null }>>; // studentId -> taskId -> status
}
