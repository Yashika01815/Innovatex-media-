/**
 * WhatsApp Broadcasts — validator (express-validator).
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  BROADCAST_STATUS_VALUES,
  BROADCAST_TYPE_VALUES,
  MAX_LIMIT,
} from './broadcasts.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid broadcast id');

const audienceRules = [
  body('audience').optional().isObject().withMessage('audience must be an object'),
  body('audience.filters').optional().isObject().withMessage('audience.filters must be an object'),
  body('audience.filters.tags').optional().isArray(),
  body('audience.filters.minimumScore').optional().isNumeric(),
  body('audience.filters.maximumScore').optional().isNumeric(),
  body('audience.includedContacts').optional().isArray(),
  body('audience.excludedContacts').optional().isArray(),
];

export const validateCreateBroadcast = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').notEmpty().withMessage('type is required')
    .bail().isIn(BROADCAST_TYPE_VALUES).withMessage('Invalid broadcast type'),
  body('templateId').notEmpty().withMessage('templateId is required')
    .bail().isMongoId().withMessage('templateId must be a valid id'),
  ...audienceRules,
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  handleValidation,
];

export const validateUpdateBroadcast = [
  idParam,
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('type').optional().isIn(BROADCAST_TYPE_VALUES).withMessage('Invalid broadcast type'),
  body('templateId').optional().isMongoId().withMessage('templateId must be a valid id'),
  ...audienceRules,
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  handleValidation,
];

export const validateIdParam = [idParam, handleValidation];

export const validateWithComment = [
  idParam,
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

export const validateSchedule = [
  idParam,
  body('scheduledAt').notEmpty().withMessage('scheduledAt is required')
    .bail().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

export const validateFail = [
  idParam,
  body('failureReason').optional().isString().isLength({ max: 500 }),
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

export const validatePreviewAudience = [
  body('filters').optional().isObject().withMessage('filters must be an object'),
  body('includedContacts').optional().isArray(),
  body('excludedContacts').optional().isArray(),
  handleValidation,
];

export const validateListBroadcasts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(BROADCAST_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(BROADCAST_TYPE_VALUES).withMessage('Invalid type'),
  query('templateId').optional().isMongoId().withMessage('Invalid templateId'),
  query('startDate').optional().isISO8601().withMessage('startDate must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be valid ISO date'),
  handleValidation,
];
