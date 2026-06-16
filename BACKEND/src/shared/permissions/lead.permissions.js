import { AppError, getContext } from '../helpers/lead.helpers.js';
import { ROLES as AUTH_ROLES } from '../../modules/auth/constants/roles.js';

/**
 * ROLES — values now match the JWT payload exactly.
 * Auth module puts 'tenant_owner' in JWT — not 'Tenant Owner'.
 * This was causing ALL lead authorization to return 403.
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: AUTH_ROLES.SUPER_ADMIN,    // 'super_admin'
  OWNER:       AUTH_ROLES.TENANT_OWNER,   // 'tenant_owner'
  ADMIN:       AUTH_ROLES.TENANT_ADMIN,   // 'tenant_admin'
  SALES:       AUTH_ROLES.SALES_USER,     // 'sales_user'
  READ_ONLY:   AUTH_ROLES.READ_ONLY_USER, // 'read_only_user'
});

export const ACTIONS = Object.freeze({
  READ:   'lead:read',
  CREATE: 'lead:create',
  UPDATE: 'lead:update',
  DELETE: 'lead:delete',
  ASSIGN: 'lead:assign',
  IMPORT: 'lead:import',
  EXPORT: 'lead:export',
});

const ALL = Object.values(ACTIONS);

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.OWNER]:       ALL,
  [ROLES.ADMIN]:       ALL,
  [ROLES.SALES]: [
    ACTIONS.READ,
    ACTIONS.CREATE,
    ACTIONS.UPDATE,
    ACTIONS.ASSIGN,
    ACTIONS.EXPORT,
  ],
  [ROLES.READ_ONLY]: [ACTIONS.READ, ACTIONS.EXPORT],
};

export function can(role, action) {
  return (ROLE_PERMISSIONS[role] || []).includes(action);
}

export const authorize = (action) => (req, _res, next) => {
  const ctx = req.context || getContext(req);
  if (!can(ctx.role, action)) {
    return next(AppError.forbidden(`Role "${ctx.role}" cannot perform ${action}`));
  }
  next();
};