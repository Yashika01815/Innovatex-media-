/**
 * Reports validators.
 * Pattern matches attribution.validator.js / call.validator.js exactly.
 */

import { query, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import { REPORT_TAB_VALUES, MAX_TABLE_LIMIT } from './report.constants.js';

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
 * validateReportQuery — shared filters used across every report tab GET.
 * SOURCE: MASTER_SPEC.md §B13 "date/source filters"
 */
export const validateReportQuery = [
  query('date_from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_from must be YYYY-MM-DD'),

  query('date_to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_to must be YYYY-MM-DD'),

  query('source')
    .optional()
    .isString().trim().notEmpty().withMessage('source must be a non-empty string'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_TABLE_LIMIT }).withMessage(`limit must be between 1 and ${MAX_TABLE_LIMIT}`),

  handleValidation,
];

/**
 * validateExportQuery — /api/reports/export requires a valid ?tab=.
 */
export const validateExportQuery = [
  query('tab')
    .notEmpty().withMessage('tab is required')
    .isIn(REPORT_TAB_VALUES).withMessage(`tab must be one of: ${REPORT_TAB_VALUES.join(', ')}`),

  query('date_from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_from must be YYYY-MM-DD'),

  query('date_to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date_to must be YYYY-MM-DD'),

  query('source')
    .optional()
    .isString().trim().notEmpty(),

  handleValidation,
];
