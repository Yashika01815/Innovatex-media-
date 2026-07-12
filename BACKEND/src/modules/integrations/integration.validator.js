/**
 * Integration validators.
 * Pattern matches template.validator.js / automation.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import {
  INTEGRATION_CATEGORY_VALUES,
  INTEGRATION_STATUS_VALUES,
} from './integration.constants.js';

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

export const validateListQuery = [
  query('category')
    .optional()
    .isIn(INTEGRATION_CATEGORY_VALUES)
    .withMessage('category must be one of: ' + INTEGRATION_CATEGORY_VALUES.join(', ')),

  query('status')
    .optional()
    .isIn(INTEGRATION_STATUS_VALUES)
    .withMessage('status must be one of: ' + INTEGRATION_STATUS_VALUES.join(', ')),

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

export const validateIdParam = [
  param('id').isMongoId().withMessage('Integration ID must be a valid MongoDB ObjectId'),
  handleValidation,
];

export const validateUpdateConfig = [
  param('id').isMongoId().withMessage('Integration ID must be a valid MongoDB ObjectId'),

  body('config')
    .notEmpty().withMessage('config is required')
    .isObject().withMessage('config must be an object'),

  handleValidation,
];
