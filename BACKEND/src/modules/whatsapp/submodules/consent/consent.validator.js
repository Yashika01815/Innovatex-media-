/**
 * WhatsApp Consent & Opt-Out — validator (express-validator).
 * Consistent with deliveryLogs.validator.js and campaigns.validator.js.
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  CONSENT_STATUS_VALUES,
  OPT_IN_METHOD_VALUES,
  OPT_OUT_METHOD_VALUES,
  CONSENT_SOURCE_VALUES,
  MAX_LIMIT,
} from './consent.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid consent id');

// E.164-ish phone validation: + and 7–15 digits.
const phoneRule = body('phoneNumber')
  .trim().notEmpty().withMessage('phoneNumber is required')
  .bail().matches(/^\+?[1-9]\d{6,14}$/).withMessage('phoneNumber must be a valid international number');

// ── Create ────────────────────────────────────────────────────────────────────
export const validateCreateConsent = [
  phoneRule,
  body('status').optional().isIn(CONSENT_STATUS_VALUES).withMessage('Invalid status'),
  body('optInMethod').optional().isIn(OPT_IN_METHOD_VALUES).withMessage('Invalid optInMethod'),
  body('optOutMethod').optional().isIn(OPT_OUT_METHOD_VALUES).withMessage('Invalid optOutMethod'),
  body('consentSource').optional().isIn(CONSENT_SOURCE_VALUES).withMessage('Invalid consentSource'),
  body('contactId').optional({ values: 'falsy' }).isMongoId().withMessage('contactId must be a valid id'),
  body('leadId').optional({ values: 'falsy' }).isMongoId().withMessage('leadId must be a valid id'),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO date'),
  body('consentText').optional().isString().isLength({ max: 2000 }),
  body('notes').optional().isString().isLength({ max: 1000 }),
  handleValidation,
];

// ── List ──────────────────────────────────────────────────────────────────────
export const validateListConsents = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(CONSENT_STATUS_VALUES).withMessage('Invalid status'),
  query('source').optional().isIn(CONSENT_SOURCE_VALUES).withMessage('Invalid source'),
  query('optInMethod').optional().isIn(OPT_IN_METHOD_VALUES).withMessage('Invalid optInMethod'),
  query('optOutMethod').optional().isIn(OPT_OUT_METHOD_VALUES).withMessage('Invalid optOutMethod'),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid ISO date'),
  handleValidation,
];

// ── :id only ──────────────────────────────────────────────────────────────────
export const validateIdParam = [idParam, handleValidation];

// ── Opt-in ────────────────────────────────────────────────────────────────────
export const validateOptIn = [
  idParam,
  body('optInMethod').optional().isIn(OPT_IN_METHOD_VALUES).withMessage('Invalid optInMethod'),
  body('consentSource').optional().isIn(CONSENT_SOURCE_VALUES).withMessage('Invalid consentSource'),
  body('consentText').optional().isString().isLength({ max: 2000 }),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO date'),
  body('reason').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Opt-out ───────────────────────────────────────────────────────────────────
export const validateOptOut = [
  idParam,
  body('optOutMethod').optional().isIn(OPT_OUT_METHOD_VALUES).withMessage('Invalid optOutMethod'),
  body('reason').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Block / Unblock ───────────────────────────────────────────────────────────
export const validateBlock = [
  idParam,
  body('reason').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

// ── Verify by phone number ────────────────────────────────────────────────────
export const validateVerify = [
  param('phoneNumber')
    .trim().notEmpty().withMessage('phoneNumber is required')
    .bail().matches(/^\+?[1-9]\d{6,14}$/).withMessage('phoneNumber must be a valid international number'),
  handleValidation,
];
