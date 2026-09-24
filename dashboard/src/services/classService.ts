import { fetchApi, API_BASE_URL, ApiError } from './api';

export interface ClassItem {
  id: string;
  className: string;
  createdAt: string;
  _count?: {
    enrollments?: number;
    students?: number;
    sessions: number;
  };
  students?: Student[];
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  membershipId?: string;
  hasPin?: boolean;
  enrollmentCount?: number;
  enrollmentId?: string;
  enrolledAt?: string;
}

export interface ImportResult {
  totalParsed: number;
  created: number;
  linked: number;
  alreadyEnrolled: number;
  enrolled: number;
  skipped: number;
  errors: string[];
}

export interface ImportPreview {
  totalParsed: number;
  preview: Array<{ rollNo: string; name: string; membershipId?: string }>;
  truncated: boolean;
}

export const classService = {
  async getClasses(): Promise<ClassItem[]> {
    return fetchApi<ClassItem[]>('/classes');
  },

  async getClass(classId: string): Promise<ClassItem & { students: Student[] }> {
    return fetchApi<ClassItem & { students: Student[] }>(`/classes/${classId}`);
  },

  async createClass(className: string): Promise<ClassItem> {
    return fetchApi<ClassItem>('/classes', {
      method: 'POST',
      body: JSON.stringify({ className }),
    });
  },

  async previewImport(classId: string, file: File): Promise<ImportPreview> {
    return uploadForm<ImportPreview>(`/classes/${classId}/import/preview`, file);
  },

  async importStudents(classId: string, file: File): Promise<ImportResult> {
    return uploadForm<ImportResult>(`/classes/${classId}/import`, file);
  },

  /** @deprecated Prefer importStudents */
  async uploadRoster(classId: string, file: File): Promise<ImportResult> {
    return this.importStudents(classId, file);
  },

  async addStudent(
    classId: string,
    data: { rollNo: string; name: string; membershipId?: string }
  ): Promise<Student> {
    return fetchApi<Student>(`/classes/${classId}/students`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async searchPool(classId: string, query: string): Promise<Student[]> {
    return fetchApi<Student[]>(
      `/classes/${classId}/students/search-pool?q=${encodeURIComponent(query)}`
    );
  },

  async unenrollStudent(classId: string, studentId: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  async resetStudentPin(classId: string, studentId: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/classes/${classId}/students/${studentId}/reset-pin`, {
      method: 'POST',
    });
  },

  async deleteClass(classId: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/classes/${classId}`, {
      method: 'DELETE',
    });
  },
};

async function uploadForm<T>(endpoint: string, file: File): Promise<T> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error || 'Upload failed', response.status);
  }

  return data.data as T;
}
