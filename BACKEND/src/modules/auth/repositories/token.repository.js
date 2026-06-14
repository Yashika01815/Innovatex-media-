/**
 * =============================================================================
 * InnovateX Revenue OS — Token Repository
 * =============================================================================
 *
 * FILE: src/modules/auth/repositories/token.repository.js
 *
 * PURPOSE
 * ───────
 * All database operations for RefreshToken, PasswordResetToken,
 * and EmailVerificationToken in one place.
 * =============================================================================
 */

import RefreshToken          from '../models/RefreshToken.js';
import PasswordResetToken    from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { hashToken }         from '../../../utils/crypto.js';

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const createRefreshToken = (data) =>
  RefreshToken.create(data);

/**
 * findRefreshToken — finds a non-revoked refresh token by its plain value.
 * Hashes the plain token before querying (we only store hashes).
 */
export const findRefreshToken = (plainToken) =>
  RefreshToken.findOne({
    tokenHash: hashToken(plainToken),
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

export const findRefreshTokenByHash = (tokenHash) =>
  RefreshToken.findOne({ tokenHash, isRevoked: false, expiresAt: { $gt: new Date() } });

export const revokeRefreshToken = (tokenHash) =>
  RefreshToken.findOneAndUpdate(
    { tokenHash },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

/**
 * revokeAllUserRefreshTokens — log out all devices for a user.
 */
export const revokeAllUserRefreshTokens = (userId) =>
  RefreshToken.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

export const getActiveSessionsByUser = (userId) =>
  RefreshToken.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } });

export const countActiveSessionsByUser = (userId) =>
  RefreshToken.countDocuments({ userId, isRevoked: false, expiresAt: { $gt: new Date() } });

export const deleteRefreshTokenByHash = (tokenHash) =>
  RefreshToken.deleteOne({ tokenHash });

// ─── Password Reset Token ─────────────────────────────────────────────────────

export const createPasswordResetToken = (data) =>
  PasswordResetToken.create(data);

export const findPasswordResetToken = (plainToken) =>
  PasswordResetToken.findOne({
    tokenHash: hashToken(plainToken),
    isUsed:    false,
    expiresAt: { $gt: new Date() },
  });

export const markPasswordResetTokenUsed = (id) =>
  PasswordResetToken.findByIdAndUpdate(id, {
    $set: { isUsed: true, usedAt: new Date() },
  });

export const invalidateExistingResetTokens = (userId) =>
  PasswordResetToken.updateMany(
    { userId, isUsed: false },
    { $set: { isUsed: true, usedAt: new Date() } }
  );

// ─── Email Verification Token ─────────────────────────────────────────────────

export const createEmailVerificationToken = (data) =>
  EmailVerificationToken.create(data);

export const findEmailVerificationToken = (plainToken) =>
  EmailVerificationToken.findOne({
    tokenHash: hashToken(plainToken),
    isUsed:    false,
    expiresAt: { $gt: new Date() },
  });

export const markEmailVerificationTokenUsed = (id) =>
  EmailVerificationToken.findByIdAndUpdate(id, {
    $set: { isUsed: true, usedAt: new Date() },
  });

export const invalidateExistingVerificationTokens = (userId) =>
  EmailVerificationToken.updateMany(
    { userId, isUsed: false },
    { $set: { isUsed: true, usedAt: new Date() } }
  );