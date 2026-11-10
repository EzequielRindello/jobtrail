const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest<T = unknown>(endpoint: string, data?: object): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_URL + endpoint, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error('Something went wrong');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
