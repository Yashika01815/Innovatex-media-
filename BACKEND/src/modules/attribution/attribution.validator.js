/**
 * Attribution validators.
 *
 * FILE: src/modules/attribution/attribution.validator.js
 * Pattern matches booking.validator.js exactly.
 */

import { body, query, validationResult }  from 'express-validator';
import { TRACKING_EVENT_TYPE_VALUES }      from './attribution.constants.js';
import { sendError }                       from '../../utils/apiResponse.js';

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
 * validateCreateEvent — POST /api/attribution/events
 */
export const validateCreateEvent = [
  body('event_type')
    .notEmpty().withMessage('event_type is required')
    .isIn(TRACKING_EVENT_TYPE_VALUES)
    .withMessage(`event_type must be one of: ${TRACKING_EVENT_TYPE_VALUES.join(', ')}`),

  body('lead_id')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('lead_id must be a valid MongoDB ObjectId'),

  body('revenue')
    .optional()
    .isFloat({ min: 0 }).withMessage('revenue must be a non-negative number'),

  handleValidation,
];

/**
 * validateListQuery — GET /api/attribution/events
 */
export const validateListQuery = [
  query('event_type')
    .optional()
    .isIn(TRACKING_EVENT_TYPE_VALUES)
    .withMessage('Invalid event_type filter'),

  query('date_from')
    .optional()
    .isISO8601().withMessage('date_from must be a valid ISO date (YYYY-MM-DD)'),

  query('date_to')
    .optional()
    .isISO8601().withMessage('date_to must be a valid ISO date (YYYY-MM-DD)'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('limit must be between 1 and 500'),

  handleValidation,
];