import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  CONSENT_STATUS_VALUES,
  OPT_OUT_STATUS_VALUES,
  CONTACT_STATUS_VALUES,
  SCORE_MIN,
  SCORE_MAX,
  MAX_LIMIT,
} from './contacts.constants.js';

const PHONE_RE = /^\+?[0-9]{7,15}$/;

/** Collects express-validator errors and forwards a 400 AppError. */
export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({
      field: e.path ?? e.param,
      message: e.msg,
    }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid contact id');

export const validateCreateContact = [
  body('phone').trim().notEmpty().withMessage('phone is required')
    .bail().matches(PHONE_RE).withMessage('phone must be 7–15 digits, optional leading +'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email must be valid'),
  body('status').optional().isIn(CONTACT_STATUS_VALUES).withMessage('Invalid status'),
  body('consentStatus').optional().isIn(CONSENT_STATUS_VALUES).withMessage('Invalid consentStatus'),
  body('optOutStatus').optional().isIn(OPT_OUT_STATUS_VALUES).withMessage('Invalid optOutStatus'),
  body('score').optional().isInt({ min: SCORE_MIN, max: SCORE_MAX })
    .withMessage(`score must be between ${SCORE_MIN} and ${SCORE_MAX}`),
  body('leadId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid leadId'),
  body('conversationId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid conversationId'),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  handleValidation,
];

export const validateUpdateContact = [
  idParam,
  body('phone').optional().trim().matches(PHONE_RE).withMessage('phone must be 7–15 digits'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('email must be valid'),
  body('status').optional().isIn(CONTACT_STATUS_VALUES).withMessage('Invalid status'),
  body('score').optional().isInt({ min: SCORE_MIN, max: SCORE_MAX })
    .withMessage(`score must be between ${SCORE_MIN} and ${SCORE_MAX}`),
  body('consentStatus').optional().isIn(CONSENT_STATUS_VALUES).withMessage('Invalid consentStatus'),
  body('optOutStatus').optional().isIn(OPT_OUT_STATUS_VALUES).withMessage('Invalid optOutStatus'),
  handleValidation,
];

export const validateConsent = [
  idParam,
  body('consentStatus').isIn(CONSENT_STATUS_VALUES).withMessage('Invalid consentStatus'),
  handleValidation,
];

export const validateOptOut = [
  idParam,
  body('optOutStatus').isIn(OPT_OUT_STATUS_VALUES).withMessage('Invalid optOutStatus'),
  handleValidation,
];

export const validateAssign = [
  idParam,
  body('userId').trim().notEmpty().withMessage('userId is required'),
  body('userName').optional().isString(),
  handleValidation,
];

export const validateAddTag = [
  idParam,
  body('tag').trim().notEmpty().withMessage('tag is required'),
  handleValidation,
];

export const validateRemoveTag = [
  idParam,
  param('tag').trim().notEmpty().withMessage('tag is required'),
  handleValidation,
];

export const validateGetContact = [idParam, handleValidation];

export const validateListContacts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(CONTACT_STATUS_VALUES).withMessage('Invalid status'),
  query('consentStatus').optional().isIn(CONSENT_STATUS_VALUES).withMessage('Invalid consentStatus'),
  query('optOutStatus').optional().isIn(OPT_OUT_STATUS_VALUES).withMessage('Invalid optOutStatus'),
  query('minScore').optional().isInt({ min: SCORE_MIN, max: SCORE_MAX }).toInt(),
  query('maxScore').optional().isInt({ min: SCORE_MIN, max: SCORE_MAX }).toInt(),
  handleValidation,
];
