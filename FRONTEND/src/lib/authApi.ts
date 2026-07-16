import { apiClient } from '@/lib/apiClient';
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload } from '@/types/auth';

/**
 * Thin, typed functions -- one per backend route. No business logic here;
 * authStore.ts owns state transitions, error handling, and side effects.
 * SOURCE: src/modules/auth/controllers/auth.controller.js
 */
export const authApi = {
  register: (payload: RegisterPayload) => apiClient.post<AuthResult>('/auth/register', payload),

  login: (payload: LoginPayload) => apiClient.post<AuthResult>('/auth/login', payload),

  refresh: () => apiClient.post<AuthResult>('/auth/refresh'),

  logout: () => apiClient.post<undefined>('/auth/logout'),

  me: () => apiClient.get<{ user: AuthUser }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch<null>('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) => apiClient.post<null>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<null>('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) => apiClient.post<{ user: AuthUser }>('/auth/verify-email', { token }),

  resendVerification: () => apiClient.post<null>('/auth/resend-verification'),
};
