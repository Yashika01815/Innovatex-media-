/**
 * =============================================================================
 * InnovateX Revenue OS — Tenant Middleware
 * =============================================================================
 *
 * FILE: src/shared/middlewares/tenant.middleware.js
 *
 * PURPOSE
 * ───────
 * THE MOST CRITICAL MIDDLEWARE for multi-tenant isolation.
 * Resolves the active tenant from JWT, validates workspace access,
 * and attaches req.tenant for downstream use.
 *
 * TENANT ISOLATION ENFORCEMENT
 * ────────────────────────────
 * Every non-super_admin API request must go through resolveTenant.
 * After this middleware, req.tenant is guaranteed to match req.user.tenantId.
 * Services must ALWAYS filter by req.tenant._id or req.user.tenantId.
 * A user can NEVER access data from another tenant.
 *
 * HOW IT FITS
 * ───────────
 * authenticate → resolveTenant → requireRole → controller
 *
 * FLOW
 * ────
 * 1. Read tenantId from req.user (JWT payload)
 * 2. Load Tenant from DB
 * 3. Call tenant.isAccessible() — block suspended/deleted workspaces
 * 4. Attach req.tenant
 *
 * super_admin BYPASS
 * ──────────────────
 * super_admin has tenantId: null in JWT.
 * resolveTenant skips the DB lookup for super_admin.
 * Super Admin routes query without tenantId filter.
 * =============================================================================
 */

import Tenant from '../../modules/auth/models/Tenant.js';
import AppError from '../../utils/AppError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ROLES } from '../../modules/auth/constants/roles.js';

/**
 * resolveTenant — loads tenant and validates workspace access.
 * Must be called AFTER authenticate middleware.
 */
export const resolveTenant = asyncHandler(async (req, res, next) => {
  const { sub: userId, role, tenantId } = req.user;

  // super_admin operates platform-wide — no tenant to resolve
  if (role === ROLES.SUPER_ADMIN) {
    req.tenant = null;
    return next();
  }

  // All other roles must have a tenantId
  if (!tenantId) {
    throw new AppError(
      'Tenant context is required for your role but was not found in session. Please log in again.',
      401
    );
  }

  // Load tenant from DB
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('Workspace not found. It may have been deleted.', 404);
  }

  // Check workspace accessibility
  const { allowed, reason } = tenant.isAccessible();
  if (!allowed) {
    const messages = {
      WORKSPACE_DELETED:    'This workspace has been deleted.',
      WORKSPACE_SUSPENDED:  tenant.suspensionReason
        ? `Workspace suspended: ${tenant.suspensionReason}`
        : 'This workspace has been suspended. Please contact InnovateX support.',
      WORKSPACE_INACTIVE:   'This workspace is inactive. Please contact your workspace owner.',
      SUBSCRIPTION_LAPSED:  'Your subscription has lapsed. Please upgrade to continue.',
    };
    throw new AppError(messages[reason] || 'Workspace access denied', 403);
  }

  // Attach tenant to request — available in all downstream handlers
  req.tenant = tenant;
  next();
});

/**
 * requireSameTenant — ensures a resource's tenantId matches the request's tenantId.
 * Use in controllers when loading resources that have a tenantId field.
 *
 * USAGE:
 *   const lead = await Lead.findById(req.params.id);
 *   requireSameTenantCheck(req, lead.tenantId);
 *
 * @param {Object} req
 * @param {string|ObjectId} resourceTenantId
 */
export const requireSameTenantCheck = (req, resourceTenantId) => {
  // super_admin can access any tenant's data
  if (req.user.role === ROLES.SUPER_ADMIN) return;

  if (!resourceTenantId) {
    throw new AppError('Resource tenant information is missing', 403);
  }

  if (req.user.tenantId?.toString() !== resourceTenantId.toString()) {
    throw new AppError('You do not have permission to access this resource', 403);
  }
};