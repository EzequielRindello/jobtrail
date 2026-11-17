export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}
