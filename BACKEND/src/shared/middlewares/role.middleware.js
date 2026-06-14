/**
 * =============================================================================
 * InnovateX Revenue OS — Role Middleware
 * =============================================================================
 *
 * FILE: src/shared/middlewares/role.middleware.js
 *
 * PURPOSE
 * ───────
 * Guards routes by minimum role rank.
 * Must be used AFTER authenticate middleware (requires req.user).
 *
 * USAGE
 * ─────
 * router.delete('/tenants/:id',
 *   authenticate,
 *   requireRole('super_admin'),
 *   tenantController.delete
 * );
 *
 * router.post('/leads',
 *   authenticate,
 *   requireRole('sales_user'),  // sales_user and above
 *   leadController.create
 * );
 * =============================================================================
 */

import { hasRole } from '../../modules/auth/constants/roles.js';
import AppError    from '../../utils/AppError.js';

/**
 * requireRole — allows access if req.user.role meets or exceeds the minimum role.
 * Uses ROLE_HIERARCHY for comparison (higher rank = more access).
 *
 * @param {...string} roles — one or more role strings (OR logic — any one is sufficient)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const userRole = req.user.role;

  // Check if user's role meets ANY of the specified minimum roles
  const hasAccess = roles.some((requiredRole) => hasRole(userRole, requiredRole));

  if (!hasAccess) {
    return next(
      new AppError(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}`,
        403
      )
    );
  }

  next();
};

/**
 * requireExactRole — allows access ONLY if user has this exact role.
 * Use sparingly — prefer requireRole (hierarchy-based) for most cases.
 *
 * @param {...string} roles — exact role values (OR logic)
 */
export const requireExactRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(`Access denied. This action is restricted to: ${roles.join(', ')}`, 403)
    );
  }

  next();
};