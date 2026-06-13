import { AppError } from '../../../shared/helpers/lead.helpers.js';
import { CONVERSATION_STATUS_VALUES } from './conversation.model.js';

export const validateAssign = (req, _res, next) => {
  const errors = [];
  if (!req.body?.userId || !String(req.body.userId).trim()) {
    errors.push({ field: 'userId', message: 'userId is required' });
  }
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};

export const validateStatus = (req, _res, next) => {
  const errors = [];
  const status = req.body?.status;
  if (!status) {
    errors.push({ field: 'status', message: 'status is required' });
  } else if (!CONVERSATION_STATUS_VALUES.includes(status)) {
    errors.push({ field: 'status', message: 'Invalid status value' });
  }
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};
