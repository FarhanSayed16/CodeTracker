import { fetchApi } from './api';

export interface Professor {
  id: string;
  email: string;
  name: string;
  department?: {
    id: string;
    name: string;
    institution?: { id: string; name: string };
  } | null;
}

export interface AuthResponse {
  token: string;
  professor: Professor;
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    departmentId?: string
  ): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, departmentId }),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<Professor> {
    return fetchApi<Professor>('/auth/me');
  },

  async updateProfile(name: string): Promise<Professor> {
    return fetchApi<Professor>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout() {
    localStorage.removeItem('token');
  },
};
