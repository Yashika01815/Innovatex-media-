/**
 * WhatsApp Analytics — validator (express-validator).
 * Read-only query validation; consistent with other WhatsApp modules.
 */
import { query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  TREND_PERIOD_VALUES,
  EXPORT_FORMAT_VALUES,
} from './whatsappAnalytics.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

// Shared filter validators reused across endpoints.
const commonFilters = [
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO date'),
  query('provider').optional().isString().trim().notEmpty().withMessage('provider must be a non-empty string'),
  query('campaignId').optional().isMongoId().withMessage('campaignId must be a valid id'),
  query('broadcastId').optional().isMongoId().withMessage('broadcastId must be a valid id'),
  query('templateId').optional().isMongoId().withMessage('templateId must be a valid id'),
  query('agentId').optional().isString().trim().notEmpty().withMessage('agentId must be a non-empty string'),
  query('status').optional().isString().trim().notEmpty(),
  query('messageType').optional().isString().trim().notEmpty(),
];

// Most analytics endpoints accept the common filter set.
export const validateAnalyticsQuery = [...commonFilters, handleValidation];

// Trends additionally require a valid period.
export const validateTrendsQuery = [
  query('period')
    .optional()
    .isIn(TREND_PERIOD_VALUES)
    .withMessage(`period must be one of: ${TREND_PERIOD_VALUES.join(', ')}`),
  ...commonFilters,
  handleValidation,
];

// Export requires a valid format.
export const validateExportQuery = [
  query('format')
    .optional()
    .customSanitizer((v) => (v ? String(v).toUpperCase() : v))
    .isIn(EXPORT_FORMAT_VALUES)
    .withMessage(`format must be one of: ${EXPORT_FORMAT_VALUES.join(', ')}`),
  ...commonFilters,
  handleValidation,
];
