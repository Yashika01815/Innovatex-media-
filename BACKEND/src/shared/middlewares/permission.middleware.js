/**
 * =============================================================================
 * InnovateX Revenue OS — Permission Middleware
 * =============================================================================
 *
 * FILE: src/shared/middlewares/permission.middleware.js
 *
 * PURPOSE
 * ───────
 * Fine-grained permission checks against req.user.permissions array.
 * Checks the LIVE user permissions from the JWT payload (which mirrors
 * the User document's permissions array).
 *
 * Used for action-level access control (e.g. "can approve templates").
 * Use requireRole for coarse-grained page/route access.
 * Use requirePermission for fine-grained action access.
 *
 * USAGE
 * ─────
 * router.patch('/templates/:id/status',
 *   authenticate,
 *   requirePermission('approve_templates'),
 *   templateController.updateStatus
 * );
 *
 * NOTE: Permissions in the JWT are seeded from User.permissions at login time.
 * They reflect the user's permissions AT LOGIN. For real-time checks (if
 * permissions changed mid-session), query the DB instead of reading the JWT.
 * =============================================================================
 */

import AppError from '../../utils/AppError.js';
import User from '../../modules/auth/models/User.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * requirePermission — checks JWT permissions array.
 * Fast path: no DB query — reads from JWT payload.
 *
 * @param {...string} permissions — required permission strings (ALL must be present)
 */
export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // req.user.permissions is set by auth.middleware when we load the full user
  // For now we check against the permissions claim if present in JWT
  // or fall through to the DB check below
  const userPermissions = req.user.permissions || [];

  const missingPermissions = permissions.filter(
    (p) => !userPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    return next(
      new AppError(
        `Access denied. Missing required permission(s): ${missingPermissions.join(', ')}`,
        403
      )
    );
  }

  next();
};

/**
 * requirePermissionFromDB — loads user from DB for real-time permission check.
 * Use when permissions may have changed since token was issued.
 * Slightly slower due to DB query.
 *
 * @param {...string} permissions
 */
export const requirePermissionFromDB = (...permissions) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const user = await User.findById(req.user.sub).select('permissions role');
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    const missingPermissions = permissions.filter(
      (p) => !user.permissions.includes(p)
    );

    if (missingPermissions.length > 0) {
      return next(
        new AppError(
          `Access denied. Missing required permission(s): ${missingPermissions.join(', ')}`,
          403
        )
      );
    }

    // Attach full user to request for downstream use
    req.dbUser = user;
    next();
  });