/**
 * Cross-cutting helpers for the Lead module.
 * Self-contained — no dependencies outside this module.
 */

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant_demo';
const DEFAULT_ROLE = process.env.DEFAULT_ROLE || 'Tenant Owner';

/** Operational error carrying an HTTP status code. */
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

/** Wrap an async handler so rejections reach Express' error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Derive request context. There is no auth module yet, so tenant / user /
 * role come from headers with safe demo defaults:
 *   x-tenant-id, x-user-id, x-user-role
 */
export function getContext(req) {
  return {
    tenantId: req.header('x-tenant-id') || DEFAULT_TENANT_ID,
    userId: req.header('x-user-id') || null,
    role: req.header('x-user-role') || DEFAULT_ROLE,
  };
}

/** Middleware that attaches req.context (idempotent). */
export const withContext = (req, _res, next) => {
  if (!req.context) req.context = getContext(req);
  next();
};

/** Pick a whitelist of keys from an object (drops undefined). */
export function pick(obj = {}, keys = []) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

/** Build a pagination metadata block. */
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

/** Normalize page/limit query values (clamped). */
export function normalizePaging(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}
