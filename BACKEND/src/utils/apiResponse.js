/**
 * =============================================================================
 * InnovateX Revenue OS — API Response Utilities
 * =============================================================================
 *
 * FILE: src/utils/apiResponse.js
 *
 * PURPOSE
 * ───────
 * Provides a consistent JSON response shape across all endpoints.
 * Every API response from InnovateX follows the same structure,
 * making the frontend service layer predictable.
 *
 * RESPONSE SHAPE
 * ──────────────
 * Success:
 *   { success: true,  message, data, meta? }
 *
 * Error:
 *   { success: false, message, errors? }
 *
 * HOW IT FITS
 * ───────────
 * auth.controller.js → calls sendSuccess / sendError
 * errorHandler.middleware.js → calls sendError for all caught errors
 * =============================================================================
 */

/**
 * sendSuccess — sends a standardised success response.
 *
 * @param {Object}  res         — Express response object
 * @param {*}       data        — response payload
 * @param {string}  message     — human-readable message
 * @param {number}  statusCode  — HTTP status (default 200)
 * @param {Object}  [meta]      — optional pagination/extra metadata
 */
export const sendSuccess = (res, data = null, message = "Success", statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * sendError — sends a standardised error response.
 *
 * @param {Object}   res        — Express response object
 * @param {string}   message    — human-readable error message
 * @param {number}   statusCode — HTTP status (default 500)
 * @param {Array}    [errors]   — optional field-level validation errors
 */
export const sendError = (res, message = "Something went wrong", statusCode = 500, errors = []) => {
  const response = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) response.errors = errors;

  return res.status(statusCode).json(response);
};

/**
 * sendCreated — convenience wrapper for 201 Created responses.
 */
export const sendCreated = (res, data, message = "Created successfully") =>
  sendSuccess(res, data, message, 201);

/**
 * sendNoContent — sends 204 No Content (e.g. on logout or delete).
 */
export const sendNoContent = (res) => res.status(204).send();

/**
 * sendPaginated — standardised paginated list response.
 *
 * @param {Object} res
 * @param {Array}  data         — array of items for this page
 * @param {Object} pagination   — { page, limit, total, totalPages }
 * @param {string} message
 */
export const sendPaginated = (res, data, pagination, message = "Success") =>
  sendSuccess(res, data, message, 200, { pagination });