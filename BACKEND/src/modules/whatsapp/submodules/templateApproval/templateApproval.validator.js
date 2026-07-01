/**
 * WhatsApp Template Approval — validator.
 *
 * express-validator chains, consistent with contacts and templates modules.
 */
import { body, param, validationResult } from 'express-validator';
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { PROVIDER_REJECTION_REASON_VALUES } from './templateApproval.constants.js';

/**
 * Collect express-validator errors and forward a 400 AppError.
 * Follows the same handleValidation pattern as contacts.validator.js.
 */
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

const idParam = param('id').isMongoId().withMessage('Invalid template id');

/** Used on all /:id action routes (submit-review, approve, etc.). */
export const validateIdParam = [idParam, handleValidation];

/** request-changes and reject require a comment; approve/submit-review accept one. */
export const validateWithComment = [
  idParam,
  body('comment')
    .optional()
    .isString().withMessage('comment must be a string')
    .isLength({ max: 500 }).withMessage('comment must not exceed 500 characters'),
  handleValidation,
];

/** request-changes and reject — comment required. */
export const validateWithRequiredComment = [
  idParam,
  body('comment')
    .notEmpty().withMessage('comment is required')
    .bail()
    .isString().withMessage('comment must be a string')
    .isLength({ max: 500 }).withMessage('comment must not exceed 500 characters'),
  handleValidation,
];

/** Provider webhook payload — no auth, but payload must carry a valid templateId. */
export const validateProviderWebhook = [
  body('templateId')
    .optional({ values: 'falsy' })
    .isMongoId().withMessage('templateId must be a valid id'),
  body('providerTemplateId')
    .optional()
    .isString(),
  body('providerRejectionReason')
    .optional({ values: 'null' })
    .isIn(PROVIDER_REJECTION_REASON_VALUES)
    .withMessage(`providerRejectionReason must be one of: ${PROVIDER_REJECTION_REASON_VALUES.join(', ')}`),
  body('providerRejectionMessage')
    .optional()
    .isString().withMessage('providerRejectionMessage must be a string')
    .isLength({ max: 500 }),
  // At least one of templateId or providerTemplateId must be present.
  body().custom((_, { req: r }) => {
    if (!r.body.templateId && !r.body.providerTemplateId) {
      throw new Error('payload must include templateId or providerTemplateId');
    }
    return true;
  }),
  handleValidation,
];
