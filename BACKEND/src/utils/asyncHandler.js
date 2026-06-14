

/**
 * asyncHandler — wraps an async Express handler.
 * @param {Function} fn — async (req, res, next) handler
 * @returns {Function} Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;