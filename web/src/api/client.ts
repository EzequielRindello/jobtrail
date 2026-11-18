const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// A GET for a file (the CSV export): returns the body as is instead of parsing JSON.
export async function apiDownload(endpoint: string): Promise<Blob> {
  const token = localStorage.getItem('token');

  const response = await fetch(API_URL + endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.title || 'Something went wrong');
  }

  return response.blob();
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  data?: object,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_URL + endpoint, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    const message = Object.values(error.errors || {}).flat()[0] as string | undefined;
    throw new Error(message || error.title || 'Something went wrong');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
