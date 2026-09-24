export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** 401 auto-logout only when the token itself is invalid — not business-logic failures. */
const shouldForceLogout = (status: number, endpoint: string) => {
  if (status !== 401) return false;
  // Authenticated endpoints that may return 401 for wrong password etc.
  if (endpoint.startsWith('/auth/change-password')) return false;
  return true;
};

export const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (shouldForceLogout(response.status, endpoint)) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    throw new ApiError(data?.error || data?.message || 'An error occurred', response.status);
  }

  return data.data as T;
};
