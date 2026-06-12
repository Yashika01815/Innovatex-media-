// NOTE: imports the shared AppError + getContext. Adjust this path if your
// shared utilities live elsewhere (see README "Integration points").
import { AppError, getContext } from '../helpers/lead.helpers.js';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Tenant Owner',
  ADMIN: 'Tenant Admin',
  SALES: 'Sales User',
  READ_ONLY: 'Read-Only User',
});

export const DEAL_ACTIONS = Object.freeze({
  READ: 'deal:read',
  CREATE: 'deal:create',
  UPDATE: 'deal:update',
  DELETE: 'deal:delete',
  MOVE: 'deal:move',
});

const ALL = Object.values(DEAL_ACTIONS);

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.OWNER]: ALL,
  [ROLES.ADMIN]: ALL,
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
    return next(
      AppError.forbidden(`Role "${ctx.role}" cannot perform ${action}`),
    );
  }
  next();
};