/**
 * Generic Template validators.
 * Pattern matches automation.validator.js / call.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import {
  TEMPLATE_TYPE_VALUES,
  TEMPLATE_SCOPE_VALUES,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_CONTENT_LENGTH,
} from './template.constants.js';

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
 * validateCreateTemplate — POST /api/templates
 */
export const validateCreateTemplate = [
  body('name')
    .notEmpty().withMessage('name is required')
    .isLength({ max: MAX_NAME_LENGTH }).withMessage('name cannot exceed ' + MAX_NAME_LENGTH + ' characters'),

  body('type')
    .notEmpty().withMessage('type is required')
    .isIn(TEMPLATE_TYPE_VALUES)
    .withMessage('type must be one of: ' + TEMPLATE_TYPE_VALUES.join(', ')),

  body('content')
    .notEmpty().withMessage('content is required')
    .isLength({ max: MAX_CONTENT_LENGTH }).withMessage('content cannot exceed ' + MAX_CONTENT_LENGTH + ' characters'),

  body('description')
    .optional()
    .isLength({ max: MAX_DESCRIPTION_LENGTH }).withMessage('description cannot exceed ' + MAX_DESCRIPTION_LENGTH + ' characters'),

  body('scope')
    .optional()
    .isIn(TEMPLATE_SCOPE_VALUES)
    .withMessage('scope must be one of: ' + TEMPLATE_SCOPE_VALUES.join(', ')),

  handleValidation,
];

/**
 * validateUpdateTemplate — PATCH /api/templates/:id
 */
export const validateUpdateTemplate = [
  param('id').isMongoId().withMessage('Template ID must be a valid MongoDB ObjectId'),

  body('name')
    .optional()
    .isLength({ max: MAX_NAME_LENGTH }).withMessage('name cannot exceed ' + MAX_NAME_LENGTH + ' characters'),

  body('type')
    .optional()
    .isIn(TEMPLATE_TYPE_VALUES)
    .withMessage('type must be one of: ' + TEMPLATE_TYPE_VALUES.join(', ')),

  body('content')
    .optional()
    .isLength({ max: MAX_CONTENT_LENGTH }).withMessage('content cannot exceed ' + MAX_CONTENT_LENGTH + ' characters'),

  body('description')
    .optional()
    .isLength({ max: MAX_DESCRIPTION_LENGTH }),

  body('scope')
    .optional()
    .isIn(TEMPLATE_SCOPE_VALUES)
    .withMessage('scope must be one of: ' + TEMPLATE_SCOPE_VALUES.join(', ')),

  handleValidation,
];

/**
 * validateListQuery — GET /api/templates
 */
export const validateListQuery = [
  query('type')
    .optional()
    .isIn(TEMPLATE_TYPE_VALUES)
    .withMessage('type must be one of: ' + TEMPLATE_TYPE_VALUES.join(', ')),

  query('scope')
    .optional()
    .isIn(TEMPLATE_SCOPE_VALUES)
    .withMessage('scope must be one of: ' + TEMPLATE_SCOPE_VALUES.join(', ')),

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
  param('id').isMongoId().withMessage('Template ID must be a valid MongoDB ObjectId'),
  handleValidation,
];
