

import { body, validationResult } from 'express-validator';
import { ROLES }                  from '../constants/roles.js';
import { sendError }              from '../../../utils/apiResponse.js';

// =============================================================================
// VALIDATION ERROR HANDLER
// =============================================================================

/**
 * handleValidation — placed LAST in every validator array.
 * Collects all validation errors and returns a 422 response if any exist.
 */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      'Validation failed',
      422,
      errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      }))
    );
  }
  next();
};

// =============================================================================
// REGISTER VALIDATOR
// =============================================================================

export const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),

  /**
   * workspaceName — required when role is tenant_owner.
   * The service also validates this, but we validate here for a clean
   * 422 response before the request reaches service layer.
   */
  body('workspaceName')
    .if(body('role').equals(ROLES.TENANT_OWNER))
    .trim()
    .notEmpty().withMessage('workspaceName is required when registering as a tenant owner')
    .isLength({ min: 2, max: 100 })
    .withMessage('workspaceName must be between 2 and 100 characters'),

  /**
   * tenantId — required for invited team members (non-owner roles).
   * Optional for tenant_owner (they create a new tenant) and super_admin (no tenant).
   */
  body('tenantId')
    .optional()
    .isMongoId().withMessage('tenantId must be a valid MongoDB ObjectId'),

  handleValidation,
];

// =============================================================================
// LOGIN VALIDATOR
// =============================================================================

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidation,
];

// =============================================================================
// FORGOT PASSWORD VALIDATOR
// =============================================================================

export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  handleValidation,
];

// =============================================================================
// RESET PASSWORD VALIDATOR
// =============================================================================

export const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  handleValidation,
];

// =============================================================================
// CHANGE PASSWORD VALIDATOR
// =============================================================================

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .custom((val, { req }) => {
      if (val === req.body.currentPassword) {
        throw new Error('New password must be different from your current password');
      }
      return true;
    }),

  handleValidation,
];

// =============================================================================
// VERIFY EMAIL VALIDATOR
// =============================================================================

export const validateVerifyEmail = [
  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required'),

  handleValidation,
];