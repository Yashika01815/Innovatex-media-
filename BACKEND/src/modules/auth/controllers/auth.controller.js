/**
 * =============================================================================
 * InnovateX Revenue OS — Auth Controller
 * =============================================================================
 *
 * FILE: src/modules/auth/controllers/auth.controller.js
 *
 * PURPOSE
 * ───────
 * Thin HTTP layer only. Extracts data from req, calls service, sends response.
 * Contains NO business logic — all logic lives in auth.service.js.
 *
 * HOW IT FITS
 * ───────────
 * auth.routes.js → validators → auth.controller.js → auth.service.js
 * =============================================================================
 */

import * as authService     from '../services/auth.service.js';
import * as passwordService from '../services/password.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../../utils/apiResponse.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookies } from '../../../utils/cookies.js';
import asyncHandler from '../../../utils/asyncHandler.js';

/**
 * register — POST /auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req);

  setRefreshTokenCookie(res, result.refreshToken);

  return sendCreated(res, {
    user:        result.user,
    accessToken: result.accessToken,
  }, 'Account created successfully. Please verify your email.');
});

/**
 * login — POST /auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password }, req);

  setRefreshTokenCookie(res, result.refreshToken);

  return sendSuccess(res, {
    user:        result.user,
    accessToken: result.accessToken,
  }, 'Login successful');
});

/**
 * logout — POST /auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromCookies(req);
  await authService.logout(refreshToken, req);
  clearRefreshTokenCookie(res);
  return sendNoContent(res);
});

/**
 * refresh — POST /auth/refresh
 * Reads refresh token from HttpOnly cookie, issues new token pair.
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromCookies(req);
  const result = await authService.refreshTokens(refreshToken, req);

  setRefreshTokenCookie(res, result.refreshToken);

  return sendSuccess(res, {
    user:        result.user,
    accessToken: result.accessToken,
  }, 'Token refreshed successfully');
});

/**
 * getMe — GET /auth/me
 * Returns the authenticated user's profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.sub);
  return sendSuccess(res, { user }, 'Profile fetched successfully');
});

/**
 * changePassword — PATCH /auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({
    userId: req.user.sub,
    currentPassword,
    newPassword,
  }, req);

  clearRefreshTokenCookie(res);
  return sendSuccess(res, null, 'Password changed successfully. Please log in again.');
});

/**
 * forgotPassword — POST /auth/forgot-password
 * Always returns 200 (anti-enumeration — don't reveal if email exists).
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await passwordService.requestPasswordReset({
    email: req.body.email,
    ip:    req.ip,
  });
  return sendSuccess(res, null,
    'If that email exists, you will receive a password reset link shortly.'
  );
});

/**
 * resetPassword — POST /auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await passwordService.resetPassword({ token, newPassword: password });
  return sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
});

/**
 * verifyEmail — POST /auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body.token);
  return sendSuccess(res, { user }, 'Email verified successfully. Welcome to InnovateX!');
});

/**
 * resendVerification — POST /auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.user.sub);
  return sendSuccess(res, null, 'Verification email sent. Please check your inbox.');
});