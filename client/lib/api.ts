const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
  isFormData?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData = false } = options;

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { token }),

  post: <T>(endpoint: string, body: any, token?: string) =>
    request<T>(endpoint, { method: 'POST', body, token }),

  patch: <T>(endpoint: string, body: any, token?: string) =>
    request<T>(endpoint, { method: 'PATCH', body, token }),

  upload: <T>(endpoint: string, formData: FormData, token?: string) =>
    request<T>(endpoint, { method: 'POST', body: formData, token, isFormData: true }),
};
