/**
 * WhatsApp Delivery Logs — validator (express-validator).
 * Consistent with campaigns / automationRules validators.
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  DIRECTION_VALUES,
  MESSAGE_TYPE_VALUES,
  DELIVERY_STATUS_VALUES,
  FAILURE_REASON_VALUES,
  PROVIDER_VALUES,
  SOURCE_VALUES,
  MAX_LIMIT,
} from './deliveryLogs.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid delivery log id');

// ── Create ────────────────────────────────────────────────────────────────────
export const validateCreateLog = [
  body('phoneNumber').trim().notEmpty().withMessage('phoneNumber is required'),
  body('provider')
    .notEmpty().withMessage('provider is required')
    .bail().isIn(PROVIDER_VALUES).withMessage(`provider must be one of: ${PROVIDER_VALUES.join(', ')}`),
  body('direction').optional().isIn(DIRECTION_VALUES).withMessage('Invalid direction'),
  body('messageType').optional().isIn(MESSAGE_TYPE_VALUES).withMessage('Invalid messageType'),
  body('status').optional().isIn(DELIVERY_STATUS_VALUES).withMessage('Invalid status'),
  body('source').optional().isIn(SOURCE_VALUES).withMessage('Invalid source'),
  body('messageId').optional({ values: 'falsy' }).isMongoId().withMessage('messageId must be a valid id'),
  body('conversationId').optional({ values: 'falsy' }).isMongoId().withMessage('conversationId must be a valid id'),
  body('contactId').optional({ values: 'falsy' }).isMongoId().withMessage('contactId must be a valid id'),
  body('leadId').optional({ values: 'falsy' }).isMongoId().withMessage('leadId must be a valid id'),
  body('campaignId').optional({ values: 'falsy' }).isMongoId().withMessage('campaignId must be a valid id'),
  body('broadcastId').optional({ values: 'falsy' }).isMongoId().withMessage('broadcastId must be a valid id'),
  body('automationRuleId').optional({ values: 'falsy' }).isMongoId().withMessage('automationRuleId must be a valid id'),
  body('templateId').optional({ values: 'falsy' }).isMongoId().withMessage('templateId must be a valid id'),
  handleValidation,
];

// ── List ──────────────────────────────────────────────────────────────────────
export const validateListLogs = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(DELIVERY_STATUS_VALUES).withMessage('Invalid status'),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('messageType').optional().isIn(MESSAGE_TYPE_VALUES).withMessage('Invalid messageType'),
  query('source').optional().isIn(SOURCE_VALUES).withMessage('Invalid source'),
  query('campaignId').optional().isMongoId().withMessage('Invalid campaignId'),
  query('broadcastId').optional().isMongoId().withMessage('Invalid broadcastId'),
  query('contactId').optional().isMongoId().withMessage('Invalid contactId'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO date'),
  handleValidation,
];

// ── :id ───────────────────────────────────────────────────────────────────────
export const validateIdParam = [idParam, handleValidation];

// ── Update status ─────────────────────────────────────────────────────────────
export const validateUpdateStatus = [
  idParam,
  body('status')
    .notEmpty().withMessage('status is required')
    .bail().isIn(DELIVERY_STATUS_VALUES).withMessage(`status must be one of: ${DELIVERY_STATUS_VALUES.join(', ')}`),
  body('failureReason').optional().isIn(FAILURE_REASON_VALUES).withMessage('Invalid failureReason'),
  body('failureCode').optional().isString(),
  handleValidation,
];

// ── Webhook ───────────────────────────────────────────────────────────────────
export const validateWebhook = [
  body('status').optional().isIn(DELIVERY_STATUS_VALUES).withMessage('Invalid status'),
  body('failureReason').optional().isIn(FAILURE_REASON_VALUES).withMessage('Invalid failureReason'),
  body().custom((_, { req: r }) => {
    if (!r.body.providerMessageId && !r.body.logId) {
      throw new Error('payload must include providerMessageId or logId');
    }
    if (!r.body.tenantId) {
      throw new Error('payload must include tenantId');
    }
    return true;
  }),
  handleValidation,
];

// ── Stats ─────────────────────────────────────────────────────────────────────
export const validateStats = [
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('campaignId').optional().isMongoId().withMessage('Invalid campaignId'),
  query('broadcastId').optional().isMongoId().withMessage('Invalid broadcastId'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO date'),
  handleValidation,
];
