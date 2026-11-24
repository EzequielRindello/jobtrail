import { apiRequest } from './client';
import { API_ENDPOINTS } from './constants';
import type { AuthResponse, LoginRequest, RegisterRequest } from './authTypes';
import { clearToken } from '../utils/authSession';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_ENDPOINTS.LOGIN, data);
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_ENDPOINTS.REGISTER, data);
}

export async function logout() {
  try {
    await apiRequest(API_ENDPOINTS.LOGOUT);
  } finally {
    clearToken();
  }
}
