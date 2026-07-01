/**
 * WhatsApp AI Reply Assistant — validator.
 *
 * express-validator chains. Consistent with campaigns.validator.js
 * and broadcasts.validator.js patterns.
 */
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import {
  PROMPT_CATEGORY_VALUES,
  TONE_VALUES,
  REWRITE_STYLE_VALUES,
  MAX_PROMPT_LENGTH,
  MAX_GENERATED_TEXT_LENGTH,
  MAX_CONVERSATION_LENGTH,
  MAX_LIMIT,
} from './aiReplyAssistant.constants.js';

export const handleValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path ?? e.param, message: e.msg }));
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};

const idParam = param('id').isMongoId().withMessage('Invalid prompt id');

// ── Prompt CRUD ────────────────────────────────────────────────────────────────

export const validateCreatePrompt = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('category')
    .notEmpty().withMessage('category is required')
    .bail().isIn(PROMPT_CATEGORY_VALUES).withMessage(`category must be one of: ${PROMPT_CATEGORY_VALUES.join(', ')}`),
  body('prompt')
    .notEmpty().withMessage('prompt is required')
    .bail().isLength({ max: MAX_PROMPT_LENGTH }).withMessage(`prompt must not exceed ${MAX_PROMPT_LENGTH} characters`),
  body('tone').optional().isIn(TONE_VALUES).withMessage(`tone must be one of: ${TONE_VALUES.join(', ')}`),
  body('languageCode').optional().isString().isLength({ min: 2, max: 10 }),
  body('description').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

export const validateUpdatePrompt = [
  idParam,
  body('title').optional().trim().notEmpty().withMessage('title cannot be empty'),
  body('category').optional().isIn(PROMPT_CATEGORY_VALUES).withMessage('Invalid category'),
  body('prompt').optional().isLength({ max: MAX_PROMPT_LENGTH }).withMessage(`prompt must not exceed ${MAX_PROMPT_LENGTH} characters`),
  body('tone').optional().isIn(TONE_VALUES).withMessage('Invalid tone'),
  body('languageCode').optional().isString().isLength({ min: 2, max: 10 }),
  handleValidation,
];

export const validateIdParam = [idParam, handleValidation];

export const validateListPrompts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  query('category').optional().isIn(PROMPT_CATEGORY_VALUES).withMessage('Invalid category'),
  query('tone').optional().isIn(TONE_VALUES).withMessage('Invalid tone'),
  query('active').optional().isBoolean(),
  query('isSystem').optional().isBoolean(),
  handleValidation,
];

// ── AI generation endpoints ────────────────────────────────────────────────────

export const validateGenerate = [
  body('goal').optional().isString().isLength({ max: 200 }),
  body('tone').optional().isIn(TONE_VALUES).withMessage('Invalid tone'),
  body('language').optional().isString().isLength({ min: 2, max: 10 }),
  body('conversation').optional().isArray().withMessage('conversation must be an array'),
  body('lead').optional().isObject().withMessage('lead must be an object'),
  body('variables').optional().isObject().withMessage('variables must be an object'),
  handleValidation,
];

export const validateRewrite = [
  body('text')
    .notEmpty().withMessage('text is required')
    .bail().isLength({ max: MAX_GENERATED_TEXT_LENGTH }).withMessage(`text must not exceed ${MAX_GENERATED_TEXT_LENGTH} characters`),
  body('style')
    .notEmpty().withMessage('style is required')
    .bail().isIn(REWRITE_STYLE_VALUES).withMessage(`style must be one of: ${REWRITE_STYLE_VALUES.join(', ')}`),
  body('variables').optional().isObject(),
  handleValidation,
];

export const validateSummarize = [
  body('conversation')
    .notEmpty().withMessage('conversation is required')
    .bail().isArray().withMessage('conversation must be an array'),
  body('lead').optional().isObject(),
  handleValidation,
];

export const validateSuggestions = [
  body('conversation').optional().isArray(),
  body('lead').optional().isObject(),
  body('variables').optional().isObject(),
  handleValidation,
];

export const validateSaveTemplate = [
  body('generatedReply').notEmpty().withMessage('generatedReply is required'),
  body('templateData.name').optional().isString(),
  body('templateData.category').optional().isString(),
  body('templateData.languageCode').optional().isString(),
  handleValidation,
];

export const validateSavePrompt = [
  body('text').notEmpty().withMessage('text is required'),
  body('title').notEmpty().withMessage('title is required'),
  body('category').optional().isIn(PROMPT_CATEGORY_VALUES).withMessage('Invalid category'),
  body('tone').optional().isIn(TONE_VALUES).withMessage('Invalid tone'),
  body('languageCode').optional().isString(),
  handleValidation,
];
