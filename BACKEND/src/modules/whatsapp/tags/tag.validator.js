import { AppError } from '../../../shared/helpers/lead.helpers.js';

// POST /api/whatsapp/conversations/:id/tags
export const validateAddTag = (req, _res, next) => {
  const errors = [];
  if (!req.body?.tag || !String(req.body.tag).trim()) {
    errors.push({ field: 'tag', message: 'tag is required' });
  }
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};
