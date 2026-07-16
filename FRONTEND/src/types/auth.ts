/**
 * Real auth types — match the ACTUAL backend response shapes exactly.
 *
 * These are intentionally separate from the legacy `User` type in
 * `@/types/index.ts`, which describes the old client-side demo user
 * (has a plaintext `password` field, Title-Case role, single `name` field --
 * none of which exist on the real backend). That legacy type is still used
 * by every other page's mock `db.users` lookups and will be retired
 * module-by-module as each page is rewired to the real API.
 *
 * SOURCE OF TRUTH: src/modules/auth/models/User.js toJSON() transform
 * (strips password/loginAttempts/lockUntil, renames _id -> id) and
 * src/config/jwt.js token payload comment.
 */

/**
 * The 5 real roles, exactly as stored on the backend (lowercase snake_case).
 * SOURCE: src/modules/auth/constants/roles.js
 */
export type AuthRole =
  | 'super_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'sales_user'
  | 'read_only_user';

/**
 * AuthUser -- the `user` object returned by /auth/login, /auth/register,
 * /auth/refresh, and /auth/me. tenantId is null only for super_admin.
 */
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AuthRole;
  tenantId: string | null;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

/** Shared envelope for every backend response -- see src/utils/apiResponse.js */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
  meta?: { pagination?: unknown };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AuthRole;
  workspaceName?: string;
  tenantId?: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

/** Human-readable label for a role -- UI display only, never sent to the backend. */
export const ROLE_LABELS: Record<AuthRole, string> = {
  super_admin: 'Super Admin',
  tenant_owner: 'Tenant Owner',
  tenant_admin: 'Tenant Admin',
  sales_user: 'Sales User',
  read_only_user: 'Read-Only User',
};
