/**
 * =============================================================================
 * InnovateX Revenue OS — RefreshToken Model
 * =============================================================================
 *
 * FILE: src/modules/auth/models/RefreshToken.js
 *
 * PURPOSE
 * ───────
 * Stores active login sessions. Each row = one device/session.
 * Enables: logout, multi-device login, refresh token rotation, session revocation.
 *
 * SECURITY DESIGN
 * ───────────────
 * - tokenHash: SHA-256 hash of the plain refresh token (stored, never the raw token)
 * - Plain token is sent to the client in an HttpOnly cookie
 * - On use: hash the incoming cookie value, find by hash, validate
 * - Rotation: delete old hash, create new one on every /auth/refresh call
 *
 * COLLECTION: refresh_tokens
 * TTL INDEX: expiresAt → MongoDB auto-deletes expired documents
 * =============================================================================
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tenantId: {
      type:    Schema.Types.ObjectId,
      ref:     'Tenant',
      default: null,
      index:   true,
    },
    // SHA-256 hash of the plain token — never store the raw token
    tokenHash: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    // Unique session ID — included in JWT payload for session tracking
    sessionId: {
      type:     String,
      required: true,
      index:    true,
    },
    // Device/client information for the sessions list UI
    deviceInfo: {
      userAgent: { type: String, default: null },
      ip:        { type: String, default: null },
      platform:  { type: String, default: null }, // e.g. "Windows", "macOS", "iOS"
      browser:   { type: String, default: null },
    },
    // When this token expires — TTL index auto-deletes the document
    expiresAt: {
      type:     Date,
      required: true,
    },
    isRevoked: {
      type:    Boolean,
      default: false,
    },
    revokedAt: {
      type:    Date,
      default: null,
    },
    // Track last usage for security auditing
    lastUsedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.tokenHash; // NEVER expose the hash
        return ret;
      },
    },
  }
);

// TTL index — MongoDB automatically removes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound for session lookup by user
refreshTokenSchema.index({ userId: 1, sessionId: 1 });
// Compound for revoking all sessions of a user
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema, 'refresh_tokens');