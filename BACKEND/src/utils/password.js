/**
 * =============================================================================
 * InnovateX Revenue OS — Password Utilities
 * =============================================================================
 *
 * FILE: src/utils/password.js
 *
 * PURPOSE
 * ───────
 * Pure Argon2id hashing functions — NO database access, NO business logic.
 * This file wraps the argon2 library with production-safe settings.
 *
 * HOW IT FITS
 * ───────────
 * password.js → User.js pre-save hook (hashPassword before storing)
 *             → auth.service.js (comparePassword on login)
 *             → password.service.js (hashPassword on reset)
 *
 * SECURITY DECISIONS
 * ──────────────────
 * - argon2id: resistant to both side-channel and GPU attacks (OWASP 2024)
 * - memoryCost: 64 MB — OWASP minimum recommendation
 * - timeCost: 3 iterations — balance of speed and security
 * - parallelism: 1 — safe default for single-threaded Node.js
 *
 * PACKAGES REQUIRED
 * ─────────────────
 * argon2 (already in package.json)
 * =============================================================================
 */

import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type:         argon2.argon2id,
  memoryCost:   65536,  // 64 MB in KiB
  timeCost:     3,
  parallelism:  1,
};

/**
 * hashPassword — hashes a plain-text password with Argon2id.
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 * @throws {Error} if hashing fails
 */
export const hashPassword = async (plainPassword) => {
  try {
    return await argon2.hash(plainPassword, ARGON2_OPTIONS);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * comparePassword — verifies a plain-text password against an Argon2id hash.
 * @param {string} plainPassword   — from login request body
 * @param {string} hashedPassword  — from User document (requires .select('+password'))
 * @returns {Promise<boolean>} true if match
 * @throws {Error} if verification fails unexpectedly
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * isValidPasswordStrength — validates password meets minimum requirements.
 * Checks: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const isValidPasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  return { valid: true, message: "Password is strong" };
};