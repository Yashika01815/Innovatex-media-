/**
 * WhatsApp Nurtures — validator (express-validator).
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  SEQUENCE_STATUS_VALUES,
  SEQUENCE_TYPE_VALUES,
  TRIGGER_TYPE_VALUES,
  DELAY_UNIT_VALUES,
  MAX_LIMIT,
} from './nurtures.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam      = param('id').isMongoId().withMessage('Invalid id');

const stepRules = [
  body('steps').optional().isArray().withMessage('steps must be an array'),
  body('steps.*.stepNumber').optional().isInt({ min: 1 }).withMessage('stepNumber must be a positive integer'),
  body('steps.*.delayValue').optional().isInt({ min: 0 }).withMessage('delayValue must be a non-negative integer'),
  body('steps.*.delayUnit').optional().isIn(DELAY_UNIT_VALUES).withMessage('Invalid delayUnit'),
  body('steps.*.templateId').optional().isMongoId().withMessage('templateId must be a valid id'),
];

// ── Sequence ───────────────────────────────────────────────────────────────────

export const validateCreateSequence = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').notEmpty().withMessage('type is required')
    .bail().isIn(SEQUENCE_TYPE_VALUES).withMessage('Invalid sequence type'),
  body('triggerType').optional().isIn(TRIGGER_TYPE_VALUES).withMessage('Invalid triggerType'),
  body('steps').notEmpty().withMessage('steps array is required')
    .bail().isArray({ min: 1 }).withMessage('At least one step is required'),
  ...stepRules,
  handleValidation,
];

export const validateUpdateSequence = [
  idParam,
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('type').optional().isIn(SEQUENCE_TYPE_VALUES).withMessage('Invalid sequence type'),
  body('triggerType').optional().isIn(TRIGGER_TYPE_VALUES).withMessage('Invalid triggerType'),
  ...stepRules,
  handleValidation,
];

export const validateIdParam = [idParam, handleValidation];

export const validateWithComment = [
  idParam,
  body('comment').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

export const validateListSequences = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(SEQUENCE_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(SEQUENCE_TYPE_VALUES).withMessage('Invalid type'),
  query('triggerType').optional().isIn(TRIGGER_TYPE_VALUES).withMessage('Invalid triggerType'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO date'),
  handleValidation,
];

// ── Enrollment ─────────────────────────────────────────────────────────────────

export const validateEnroll = [
  idParam,
  body().custom((_, { req: r }) => {
    if (!r.body.leadId && !r.body.contactId) {
      throw new Error('leadId or contactId is required');
    }
    return true;
  }),
  body('leadId').optional({ values: 'falsy' }).isMongoId().withMessage('leadId must be a valid id'),
  body('contactId').optional({ values: 'falsy' }).isMongoId().withMessage('contactId must be a valid id'),
  handleValidation,
];

export const validateListEnrollments = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('sequenceId').optional().isMongoId().withMessage('Invalid sequenceId'),
  query('leadId').optional().isMongoId().withMessage('Invalid leadId'),
  query('contactId').optional().isMongoId().withMessage('Invalid contactId'),
  query('status').optional().isString(),
  handleValidation,
];
