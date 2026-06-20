/**
 * Call Intelligence validators.
 * Pattern matches booking.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import { CALL_OUTCOME_VALUES }                   from './call.constants.js';
import { sendError }                             from '../../utils/apiResponse.js';

/** Collect express-validator errors and return 422. Pattern from booking.validator.js. */
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
 * validateCreateCall — POST /api/calls
 * Required fields from DEVELOPER_HANDOFF.md §6 CallRecord entity.
 * Matches Log Call modal fields from FRONTEND_SPEC §10:
 *   LEAD dropdown | OUTCOME dropdown | TRANSCRIPT textarea
 */
export const validateCreateCall = [
  body('lead_id')
    .notEmpty().withMessage('lead_id is required')
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  body('assigned_user_id')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('assigned_user_id must be a valid MongoDB ObjectId'),

  body('outcome')
    .notEmpty().withMessage('outcome is required')
    .isIn(CALL_OUTCOME_VALUES)
    .withMessage(`outcome must be one of: ${CALL_OUTCOME_VALUES.join(', ')}`),

  body('call_date')
    .notEmpty().withMessage('call_date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('call_date must be YYYY-MM-DD'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 0 }).withMessage('duration_minutes must be a non-negative integer'),

  body('transcript')
    .optional()
    .isString()
    .isLength({ max: 50000 }).withMessage('transcript cannot exceed 50000 characters'),

  handleValidation,
];

/**
 * validateUpdateCall — PATCH /api/calls/:id
 * All fields optional for partial update.
 */
export const validateUpdateCall = [
  param('id')
    .isMongoId().withMessage('Call ID must be a valid MongoDB ObjectId'),

  body('outcome')
    .optional()
    .isIn(CALL_OUTCOME_VALUES)
    .withMessage(`outcome must be one of: ${CALL_OUTCOME_VALUES.join(', ')}`),

  body('call_date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('call_date must be YYYY-MM-DD'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 0 }).withMessage('duration_minutes must be a non-negative integer'),

  body('transcript')
    .optional()
    .isString()
    .isLength({ max: 50000 }).withMessage('transcript cannot exceed 50000 characters'),

  body('summary')
    .optional()
    .isString()
    .isLength({ max: 5000 }).withMessage('summary cannot exceed 5000 characters'),

  body('score')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('score must be between 0 and 10'),

  handleValidation,
];

/**
 * validateListQuery — GET /api/calls
 * Filters align with FRONTEND_SPEC §10 call cards display.
 */
export const validateListQuery = [
  query('outcome')
    .optional()
    .isIn(CALL_OUTCOME_VALUES)
    .withMessage('Invalid outcome filter'),

  query('assigned_user_id')
    .optional()
    .isMongoId().withMessage('assigned_user_id must be a valid MongoDB ObjectId'),

  query('date_from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_from must be YYYY-MM-DD'),

  query('date_to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_to must be YYYY-MM-DD'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  handleValidation,
];