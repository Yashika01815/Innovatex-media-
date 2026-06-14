/**
 * =============================================================================
 * InnovateX Revenue OS — AppError
 * =============================================================================
 *
 * FILE: src/utils/AppError.js
 *
 * PURPOSE
 * ───────
 * Custom operational error class. Extends Error with statusCode and
 * isOperational flag. All deliberate application errors (bad input,
 * auth failures, not found) should throw AppError — not generic Error.
 *
 * HOW IT FITS
 * ───────────
 * Services throw AppError  →  asyncHandler catches it  →
 * errorHandler.middleware.js formats and sends the response.
 *
 * isOperational = true  → expected error, send to client
 * isOperational = false → programmer error / unexpected crash, log only
 * =============================================================================
 */

export class AppError extends Error {
  /**
   * @param {string}  message     — human-readable error description
   * @param {number}  statusCode  — HTTP status code (400, 401, 403, 404, 409, etc.)
   * @param {Array}   [errors]    — optional array of field-level validation errors
   */
  constructor(message, statusCode, errors = []) {
    super(message);

    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors        = errors;

    // Preserves correct stack trace in V8 (Node.js)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Convenience Factory Methods ──────────────────────────────────────────────

/** 400 Bad Request */
export const BadRequest = (message, errors = []) =>
  new AppError(message, 400, errors);

/** 401 Unauthorized */
export const Unauthorized = (message = "Authentication required") =>
  new AppError(message, 401);

/** 403 Forbidden */
export const Forbidden = (message = "You do not have permission to perform this action") =>
  new AppError(message, 403);

/** 404 Not Found */
export const NotFound = (message = "Resource not found") =>
  new AppError(message, 404);

/** 409 Conflict */
export const Conflict = (message) =>
  new AppError(message, 409);

/** 422 Unprocessable Entity */
export const UnprocessableEntity = (message, errors = []) =>
  new AppError(message, 422, errors);

/** 429 Too Many Requests */
export const TooManyRequests = (message = "Too many requests. Please try again later.") =>
  new AppError(message, 429);

/** 500 Internal Server Error */
export const InternalError = (message = "Internal server error") =>
  new AppError(message, 500);

export default AppError;