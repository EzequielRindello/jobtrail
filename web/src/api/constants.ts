export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  NO_CONTENT: 204,
} as const;

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
} as const;
