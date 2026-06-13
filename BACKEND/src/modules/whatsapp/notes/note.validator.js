import { AppError } from '../../../shared/helpers/lead.helpers.js';

// POST /api/whatsapp/conversations/:id/notes
export const validateCreateNote = (req, _res, next) => {
  const errors = [];
  if (!req.body?.body || !String(req.body.body).trim()) {
    errors.push({ field: 'body', message: 'body is required' });
  }
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};
