/**
 * AI Qualification validators.
 * Pattern matches booking.validator.js and call.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';

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
 * validateRunQualification — POST /api/qualification/run
 * SOURCE: FRONTEND_SPEC §6 "pick lead → answer discovery questions → Run AI Qualification"
 * SOURCE: DEVELOPER_HANDOFF.md aiService.qualifyLead(lead, answers)
 */
export const validateRunQualification = [
  body('lead_id')
    .notEmpty().withMessage('lead_id is required')
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  body('answers')
    .notEmpty().withMessage('answers is required')
    .isObject().withMessage('answers must be an object'),

  handleValidation,
];

/**
 * validateApply — POST /api/qualification/:id/apply
 * No body fields required — qualificationId from param is sufficient.
 */
export const validateApply = [
  param('id')
    .isMongoId().withMessage('Qualification ID must be a valid MongoDB ObjectId'),

  handleValidation,
];

/**
 * validateOverride — PATCH /api/qualification/:id/override
 * SOURCE: FRONTEND_SPEC §6 "Human override supported"
 */
export const validateOverride = [
  param('id')
    .isMongoId().withMessage('Qualification ID must be a valid MongoDB ObjectId'),

  body('override_score')
    .notEmpty().withMessage('override_score is required')
    .isFloat({ min: 0, max: 10 })
    .withMessage('override_score must be a number between 0 and 10'),

  handleValidation,
];

/**
 * validateListQuery — GET /api/qualification
 */
export const validateListQuery = [
  query('applied')
    .optional()
    .isBoolean().withMessage('applied must be true or false'),

  query('temperature')
    .optional()
    .isIn(['Hot', 'Warm', 'Cold']).withMessage('temperature must be Hot, Warm, or Cold'),

  query('lead_id')
    .optional()
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),

  handleValidation,
];