import { apiRequest } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from './authTypes';
import { clearToken } from '../utils/authSession';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', data);
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', data);
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout');
  } finally {
    clearToken();
  }
}
