/**
 * Cross-cutting helpers for the Lead module.
 *
 * WHAT CHANGED:
 * getContext() now reads from req.user (JWT) when available,
 * falling back to headers for backward compatibility during testing.
 * This bridges the gap between booking routes (JWT) and lead/pipeline
 * routes (withContext) so they share the same tenantId.
 */

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant_demo';
const DEFAULT_ROLE = process.env.DEFAULT_ROLE || 'tenant_owner';

export class AppError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
  static badRequest(message = 'Bad request', details) {
    return new AppError(400, message, details);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }
  static conflict(message = 'Conflict', details) {
    return new AppError(409, message, details);
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * getContext — derives tenantId, userId, role from the request.
 *
 * Priority:
 * 1. req.user (set by authenticate JWT middleware) — used by booking routes
 * 2. x-tenant-id / x-user-id / x-user-role headers — used by lead/pipeline routes
 * 3. environment defaults — for local dev without auth
 *
 * This ensures lead.service.js ctx.tenantId matches booking.service.js ctx.tenantId
 * when both are called in the same user session.
 */
export function getContext(req) {
  if (req.user) {
    return {
      tenantId: req.user.tenantId,
      userId:   req.user.sub,
      role:     req.user.role,
    };
  }
  return {
    tenantId: req.header('x-tenant-id') || DEFAULT_TENANT_ID,
    userId:   req.header('x-user-id')   || null,
    role:     req.header('x-user-role') || DEFAULT_ROLE,
  };
}

export const withContext = (req, _res, next) => {
  if (!req.context) req.context = getContext(req);
  next();
};

export function pick(obj = {}, keys = []) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export function paginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

export function normalizePaging(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}