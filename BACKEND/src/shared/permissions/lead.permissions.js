import { AppError, getContext } from '../helpers/lead.helpers.js';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Tenant Owner',
  ADMIN: 'Tenant Admin',
  SALES: 'Sales User',
  READ_ONLY: 'Read-Only User',
});

export const ACTIONS = Object.freeze({
  READ: 'lead:read',
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
  [ROLES.OWNER]: ALL,
  [ROLES.ADMIN]: ALL,
  [ROLES.SALES]: [
    ACTIONS.READ,
    ACTIONS.CREATE,
    ACTIONS.UPDATE,
    ACTIONS.ASSIGN,
    ACTIONS.EXPORT,
  ],
  [ROLES.READ_ONLY]: [ACTIONS.READ, ACTIONS.EXPORT],
};

/** Returns true if a role may perform an action. */
export function can(role, action) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(action);
}

/** Express middleware enforcing an action permission for the request role. */
export const authorize = (action) => (req, _res, next) => {
  const ctx = req.context || getContext(req);
  if (!can(ctx.role, action)) {
    return next(
      AppError.forbidden(`Role "${ctx.role}" cannot perform ${action}`),
    );
  }
  next();
};