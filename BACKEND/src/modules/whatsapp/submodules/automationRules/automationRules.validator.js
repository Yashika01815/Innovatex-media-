/**
 * WhatsApp Automation Rules — validator (express-validator).
 * Consistent with campaigns.validator.js and aiReplyAssistant.validator.js.
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  RULE_STATUS_VALUES,
  TRIGGER_TYPE_VALUES,
  CONDITION_OPERATOR_VALUES,
  CONDITION_LOGIC_VALUES,
  ACTION_TYPE_VALUES,
  EXECUTION_MODE_VALUES,
  DELAY_UNIT_VALUES,
  PRIORITY_MIN,
  PRIORITY_MAX,
  MAX_LIMIT,
} from './automationRules.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid rule id');

// ── Condition array rules ──────────────────────────────────────────────────────
const conditionRules = [
  body('conditions').optional().isArray().withMessage('conditions must be an array'),
  body('conditions.*.field').optional().isString().notEmpty().withMessage('condition field is required'),
  body('conditions.*.operator')
    .optional()
    .isIn(CONDITION_OPERATOR_VALUES)
    .withMessage(`condition operator must be one of: ${CONDITION_OPERATOR_VALUES.join(', ')}`),
  body('conditionLogic')
    .optional()
    .isIn(CONDITION_LOGIC_VALUES)
    .withMessage(`conditionLogic must be AND or OR`),
];

// ── Action array rules ────────────────────────────────────────────────────────
const actionRules = [
  body('actions').optional().isArray().withMessage('actions must be an array'),
  body('actions.*.order').optional().isInt({ min: 1 }).withMessage('action order must be >= 1'),
  body('actions.*.type')
    .optional()
    .isIn(ACTION_TYPE_VALUES)
    .withMessage(`action type must be one of: ${ACTION_TYPE_VALUES.join(', ')}`),
];

// ── Create ────────────────────────────────────────────────────────────────────
export const validateCreateRule = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('trigger').notEmpty().withMessage('trigger is required').isObject().withMessage('trigger must be an object'),
  body('trigger.type')
    .notEmpty().withMessage('trigger.type is required')
    .bail()
    .isIn(TRIGGER_TYPE_VALUES).withMessage(`trigger.type must be one of: ${TRIGGER_TYPE_VALUES.join(', ')}`),
  body('status').optional().isIn(RULE_STATUS_VALUES).withMessage('Invalid status'),
  body('priority').optional().isInt({ min: PRIORITY_MIN, max: PRIORITY_MAX })
    .withMessage(`priority must be between ${PRIORITY_MIN} and ${PRIORITY_MAX}`),
  body('executionMode').optional().isIn(EXECUTION_MODE_VALUES).withMessage('Invalid executionMode'),
  body('delay.value').optional().isInt({ min: 0 }).withMessage('delay.value must be >= 0'),
  body('delay.unit').optional().isIn(DELAY_UNIT_VALUES).withMessage(`delay.unit must be one of: ${DELAY_UNIT_VALUES.join(', ')}`),
  body('description').optional().isString().isLength({ max: 1000 }),
  ...conditionRules,
  ...actionRules,
  handleValidation,
];

// ── Update ────────────────────────────────────────────────────────────────────
export const validateUpdateRule = [
  idParam,
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('trigger.type').optional().isIn(TRIGGER_TYPE_VALUES).withMessage('Invalid trigger type'),
  body('status').optional().isIn(RULE_STATUS_VALUES).withMessage('Invalid status'),
  body('priority').optional().isInt({ min: PRIORITY_MIN, max: PRIORITY_MAX })
    .withMessage(`priority must be between ${PRIORITY_MIN} and ${PRIORITY_MAX}`),
  body('executionMode').optional().isIn(EXECUTION_MODE_VALUES).withMessage('Invalid executionMode'),
  body('delay.value').optional().isInt({ min: 0 }),
  body('delay.unit').optional().isIn(DELAY_UNIT_VALUES),
  ...conditionRules,
  ...actionRules,
  handleValidation,
];

// ── List ──────────────────────────────────────────────────────────────────────
export const validateListRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('status').optional().isIn(RULE_STATUS_VALUES).withMessage('Invalid status'),
  query('trigger').optional().isIn(TRIGGER_TYPE_VALUES).withMessage('Invalid trigger type'),
  query('active').optional().isBoolean(),
  handleValidation,
];

// ── :id only ──────────────────────────────────────────────────────────────────
export const validateIdParam = [idParam, handleValidation];

// ── Manual run ────────────────────────────────────────────────────────────────
export const validateRun = [
  idParam,
  body('leadId').optional({ values: 'falsy' }).isMongoId().withMessage('leadId must be a valid id'),
  body('contactId').optional({ values: 'falsy' }).isMongoId().withMessage('contactId must be a valid id'),
  body('campaignId').optional({ values: 'falsy' }).isMongoId().withMessage('campaignId must be a valid id'),
  body('lead').optional().isObject(),
  body('contact').optional().isObject(),
  handleValidation,
];
