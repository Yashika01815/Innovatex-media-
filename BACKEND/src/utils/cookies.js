/**
 * =============================================================================
 * InnovateX Revenue OS — Cookie Utilities
 * =============================================================================
 *
 * FILE: src/utils/cookies.js
 *
 * PURPOSE
 * ───────
 * Centralised helpers for setting and clearing HTTP cookies.
 * Enforces consistent security attributes across all auth endpoints.
 *
 * HOW IT FITS
 * ───────────
 * cookies.js → auth.service.js (set refresh token cookie on login/refresh)
 *            → auth.controller.js (clear cookie on logout)
 *
 * SECURITY ATTRIBUTES
 * ───────────────────
 * httpOnly: true   — inaccessible to JavaScript (prevents XSS token theft)
 * secure: true     — HTTPS only in production
 * sameSite: strict — prevents CSRF (cookie not sent on cross-site requests)
 * path: /          — cookie available on all routes
 *
 * ENVIRONMENT VARIABLES
 * ──────────────────────
 * NODE_ENV — "production" enables secure flag
 * =============================================================================
 */

import { COOKIE_NAMES, TOKEN_EXPIRY } from '../modules/auth/constants/auth.constants.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * getRefreshTokenCookieOptions — returns the standard options for the refresh token cookie.
 * @returns {Object} cookie options
 */
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure:   isProduction,
  sameSite: isProduction ? 'strict' : 'lax', // 'lax' allows localhost dev
  maxAge:   TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS * 1000, // milliseconds
  path:     '/',
});

/**
 * setRefreshTokenCookie — sets the HttpOnly refresh token cookie on the response.
 * @param {Object} res           — Express response object
 * @param {string} refreshToken  — plain refresh token (NOT the hash)
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    refreshToken,
    getRefreshTokenCookieOptions()
  );
};

/**
 * clearRefreshTokenCookie — clears the refresh token cookie (logout/session revocation).
 * Must use identical path and domain as the set call.
 * @param {Object} res — Express response object
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path:     '/',
  });
};

/**
 * getRefreshTokenFromCookies — safely reads the refresh token from request cookies.
 * Returns null if not present (avoids undefined errors).
 * @param {Object} req — Express request object
 * @returns {string|null}
 */
export const getRefreshTokenFromCookies = (req) =>
  req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ?? null;