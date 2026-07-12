/**
 * Nurture validators.
 * Pattern matches call.validator.js / booking.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import {
  SEQUENCE_STATUS_VALUES,
  NURTURE_CHANNEL_VALUES,
  MAX_STEPS_PER_SEQUENCE,
  MAX_DELAY_DAYS,
  MAX_MESSAGE_LENGTH,
} from './nurture.constants.js';

/** Collect express-validator errors and return 422. */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      'Validation failed',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

/**
 * validateCreateSequence — POST /api/nurture
 */
export const validateCreateSequence = [
  body('name')
    .notEmpty().withMessage('name is required')
    .isLength({ max: 100 }).withMessage('name cannot exceed 100 characters'),

  body('description')
    .optional()
    .isString(),

  body('trigger')
    .optional()
    .isString(),

  body('steps')
    .optional()
    .isArray({ max: MAX_STEPS_PER_SEQUENCE })
    .withMessage('steps must be an array with at most ' + MAX_STEPS_PER_SEQUENCE + ' entries'),

  body('steps.*.order')
    .optional()
    .isInt({ min: 1 }).withMessage('step order must be a positive integer'),

  body('steps.*.channel')
    .optional()
    .isIn(NURTURE_CHANNEL_VALUES)
    .withMessage('step channel must be one of: ' + NURTURE_CHANNEL_VALUES.join(', ')),

  body('steps.*.delay_days')
    .optional()
    .isInt({ min: 0, max: MAX_DELAY_DAYS }).withMessage('step delay_days must be between 0 and ' + MAX_DELAY_DAYS),

  body('steps.*.message')
    .optional()
    .isLength({ max: MAX_MESSAGE_LENGTH }).withMessage('step message cannot exceed ' + MAX_MESSAGE_LENGTH + ' characters'),

  handleValidation,
];

/**
 * validateUpdateSequence — PATCH /api/nurture/:id
 */
export const validateUpdateSequence = [
  param('id').isMongoId().withMessage('Sequence ID must be a valid MongoDB ObjectId'),

  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('name cannot exceed 100 characters'),

  body('status')
    .optional()
    .isIn(SEQUENCE_STATUS_VALUES)
    .withMessage('status must be one of: ' + SEQUENCE_STATUS_VALUES.join(', ')),

  body('steps')
    .optional()
    .isArray({ max: MAX_STEPS_PER_SEQUENCE }),

  handleValidation,
];

/**
 * validateListQuery — GET /api/nurture
 */
export const validateListQuery = [
  query('status')
    .optional()
    .isIn(SEQUENCE_STATUS_VALUES)
    .withMessage('status must be one of: ' + SEQUENCE_STATUS_VALUES.join(', ')),

  query('search')
    .optional()
    .isString(),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  handleValidation,
];

/**
 * validateIdParam — routes with only an :id param.
 */
export const validateIdParam = [
  param('id').isMongoId().withMessage('Sequence ID must be a valid MongoDB ObjectId'),
  handleValidation,
];

/**
 * validateAssignSequence — POST /api/nurture/:id/assign
 */
export const validateAssignSequence = [
  param('id').isMongoId().withMessage('Sequence ID must be a valid MongoDB ObjectId'),

  body('leadId')
    .notEmpty().withMessage('leadId is required')
    .isMongoId().withMessage('leadId must be a valid MongoDB ObjectId'),

  handleValidation,
];

/**
 * validateListEnrollmentsQuery — GET /api/nurture/enrollments
 */
export const validateListEnrollmentsQuery = [
  query('sequence_id')
    .optional()
    .isMongoId().withMessage('sequence_id must be a valid MongoDB ObjectId'),

  query('lead_id')
    .optional()
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  query('status')
    .optional()
    .isString(),

  query('page')
    .optional()
    .isInt({ min: 1 }),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }),

  handleValidation,
];
