/**
 * Payment validators.
 *
 * FILE: src/modules/payments/payment.validator.js
 * Pattern matches booking.validator.js and call.validator.js exactly.
 */

import { body, param, query, validationResult } from 'express-validator';
import {
  PAYMENT_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_CURRENCY_VALUES,
} from './payment.constants.js';
import { sendError } from '../../utils/apiResponse.js';

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
 * validateCreatePayment — POST /api/payments
 * SOURCE: FRONTEND_SPEC §13 "New Payment Link" modal:
 *   LEAD | AMOUNT (USD) | METHOD
 */
export const validateCreatePayment = [
  body('lead_id')
    .notEmpty().withMessage('lead_id is required')
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  body('amount')
    .notEmpty().withMessage('amount is required')
    .isFloat({ min: 0.01 }).withMessage('amount must be greater than 0'),

  body('currency')
    .optional()
    .isIn(PAYMENT_CURRENCY_VALUES)
    .withMessage(`currency must be one of: ${PAYMENT_CURRENCY_VALUES.join(', ')}`),

  body('payment_method')
    .optional()
    .isIn(PAYMENT_METHOD_VALUES)
    .withMessage(`payment_method must be one of: ${PAYMENT_METHOD_VALUES.join(', ')}`),

  body('deal_id')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('deal_id must be a valid MongoDB ObjectId'),

  handleValidation,
];

/**
 * validateUpdatePayment — PATCH /api/payments/:id
 */
export const validateUpdatePayment = [
  param('id')
    .isMongoId().withMessage('Payment ID must be a valid MongoDB ObjectId'),

  body('status')
    .optional()
    .isIn(PAYMENT_STATUS_VALUES)
    .withMessage(`status must be one of: ${PAYMENT_STATUS_VALUES.join(', ')}`),

  body('payment_method')
    .optional()
    .isIn(PAYMENT_METHOD_VALUES)
    .withMessage(`payment_method must be one of: ${PAYMENT_METHOD_VALUES.join(', ')}`),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('amount must be greater than 0'),

  handleValidation,
];

/**
 * validateRefund — POST /api/payments/:id/refund
 */
export const validateRefund = [
  param('id')
    .isMongoId().withMessage('Payment ID must be a valid MongoDB ObjectId'),

  body('refund_reason')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage('refund_reason cannot exceed 500 characters'),

  handleValidation,
];

/**
 * validateListQuery — GET /api/payments
 */
export const validateListQuery = [
  query('status')
    .optional()
    .isIn(PAYMENT_STATUS_VALUES)
    .withMessage('Invalid status filter'),

  query('payment_method')
    .optional()
    .isIn(PAYMENT_METHOD_VALUES)
    .withMessage('Invalid payment_method filter'),

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