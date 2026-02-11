import * as Sentry from '@sentry/nextjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(`API Error ${status}: ${JSON.stringify(data)}`);
  }
}

async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
  } catch (networkError) {
    // Network-level failure (backend unreachable, DNS failure, CORS, etc.)
    Sentry.captureException(networkError, {
      tags: { api_path: path, api_method: options?.method || 'GET' },
    });
    throw networkError;
  }
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch { data = { detail: res.statusText }; }
    const error = new ApiError(res.status, data);
    Sentry.captureException(error, {
      tags: { api_path: path, api_method: options?.method || 'GET', api_status: res.status },
    });
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiClient<T>(path),
  post: <T>(path: string, body?: any) => apiClient<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: any) => apiClient<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiClient<T>(path, { method: 'DELETE' }),
};

export { ApiError };
export default api;
