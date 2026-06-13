import { AppError } from '../../../shared/helpers/lead.helpers.js';
import { MESSAGE_TYPE_VALUES } from './message.model.js';

function validateBody(req) {
  const errors = [];
  if (!req.body?.conversationId || !String(req.body.conversationId).trim()) {
    errors.push({ field: 'conversationId', message: 'conversationId is required' });
  }
  if (!req.body?.content || !String(req.body.content).trim()) {
    errors.push({ field: 'content', message: 'content is required' });
  }
  if (req.body?.type !== undefined && !MESSAGE_TYPE_VALUES.includes(req.body.type)) {
    errors.push({ field: 'type', message: 'Invalid message type' });
  }
  return errors;
}

export const validateSend = (req, _res, next) => {
  const errors = validateBody(req);
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};

export const validateSimulateInbound = (req, _res, next) => {
  const errors = validateBody(req);
  if (errors.length) return next(AppError.badRequest('Validation failed', errors));
  next();
};
