/**
 * WhatsApp Campaigns — validator.
 *
 * express-validator chains, consistent with contacts, templates and
 * templateApproval validators.
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  CAMPAIGN_STATUS_VALUES,
  CAMPAIGN_TYPE_VALUES,
  MAX_LIMIT,
} from './campaigns.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid campaign id');

// ── Shared audience body rules ─────────────────────────────────────────────────
const audienceRules = [
  body('audience').optional().isObject().withMessage('audience must be an object'),
  body('audience.filters').optional().isObject().withMessage('audience.filters must be an object'),
  body('audience.filters.tags').optional().isArray().withMessage('audience.filters.tags must be an array'),
  body('audience.filters.minimumScore').optional().isNumeric().withMessage('minimumScore must be numeric'),
  body('audience.filters.maximumScore').optional().isNumeric().withMessage('maximumScore must be numeric'),
  body('audience.includedContacts').optional().isArray(),
  body('audience.excludedContacts').optional().isArray(),
];

// ── Create ─────────────────────────────────────────────────────────────────────
export const validateCreateCampaign = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').notEmpty().withMessage('type is required')
    .bail().isIn(CAMPAIGN_TYPE_VALUES).withMessage('Invalid campaign type'),
  body('templateId').notEmpty().withMessage('templateId is required')
    .bail().isMongoId().withMessage('templateId must be a valid id'),
  ...audienceRules,
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  handleValidation,
];

// ── Update ─────────────────────────────────────────────────────────────────────
export const validateUpdateCampaign = [
  idParam,
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('type').optional().isIn(CAMPAIGN_TYPE_VALUES).withMessage('Invalid campaign type'),
  body('templateId').optional().isMongoId().withMessage('templateId must be a valid id'),
  ...audienceRules,
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  handleValidation,
];

// ── :id only ───────────────────────────────────────────────────────────────────
export const validateIdParam = [idParam, handleValidation];

// ── Optional comment (approve, start, complete, cancel) ──────────────────────
export const validateWithComment = [
  idParam,
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Schedule (requires scheduledAt) ───────────────────────────────────────────
export const validateSchedule = [
  idParam,
  body('scheduledAt').notEmpty().withMessage('scheduledAt is required')
    .bail().isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Fail (requires failureReason) ─────────────────────────────────────────────
export const validateFail = [
  idParam,
  body('failureReason').optional().isString().isLength({ max: 500 }),
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Preview audience ──────────────────────────────────────────────────────────
export const validatePreviewAudience = [
  body('filters').optional().isObject().withMessage('filters must be an object'),
  body('includedContacts').optional().isArray(),
  body('excludedContacts').optional().isArray(),
  handleValidation,
];

// ── List ───────────────────────────────────────────────────────────────────────
export const validateListCampaigns = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(CAMPAIGN_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(CAMPAIGN_TYPE_VALUES).withMessage('Invalid type'),
  query('templateId').optional().isMongoId().withMessage('Invalid templateId'),
  query('startDate').optional().isISO8601().withMessage('startDate must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be valid ISO date'),
  handleValidation,
];
