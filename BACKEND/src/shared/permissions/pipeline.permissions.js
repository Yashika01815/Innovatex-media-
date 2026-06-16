import { AppError, getContext } from '../helpers/lead.helpers.js';
import { ROLES as AUTH_ROLES } from '../../modules/auth/constants/roles.js';

/**
 * ROLES — values now match the JWT payload exactly.
 * Was: 'Tenant Owner' (Title Case) — JWT sends: 'tenant_owner'
 * Fixed to use AUTH_ROLES constants as single source of truth.
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: AUTH_ROLES.SUPER_ADMIN,    // 'super_admin'
  OWNER:       AUTH_ROLES.TENANT_OWNER,   // 'tenant_owner'
  ADMIN:       AUTH_ROLES.TENANT_ADMIN,   // 'tenant_admin'
  SALES:       AUTH_ROLES.SALES_USER,     // 'sales_user'
  READ_ONLY:   AUTH_ROLES.READ_ONLY_USER, // 'read_only_user'
});

export const DEAL_ACTIONS = Object.freeze({
  READ:   'deal:read',
  CREATE: 'deal:create',
  UPDATE: 'deal:update',
  DELETE: 'deal:delete',
  MOVE:   'deal:move',
});

const ALL = Object.values(DEAL_ACTIONS);

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.OWNER]:       ALL,
  [ROLES.ADMIN]:       ALL,
  [ROLES.SALES]: [
    DEAL_ACTIONS.READ,
    DEAL_ACTIONS.CREATE,
    DEAL_ACTIONS.UPDATE,
    DEAL_ACTIONS.MOVE,
  ],
  [ROLES.READ_ONLY]: [DEAL_ACTIONS.READ],
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