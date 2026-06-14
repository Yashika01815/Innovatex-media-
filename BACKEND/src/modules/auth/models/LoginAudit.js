/**
 * =============================================================================
 * InnovateX Revenue OS — LoginAudit Model
 * =============================================================================
 *
 * FILE: src/modules/auth/models/LoginAudit.js
 *
 * PURPOSE
 * ───────
 * Immutable security log. Records every login attempt (success and failure).
 * Used for: security dashboards, suspicious activity detection,
 * compliance auditing, and blocked-account investigations.
 *
 * COLLECTION: login_audits
 * RETENTION: documents are not auto-deleted (keep for audit purposes)
 * =============================================================================
 */

import mongoose from 'mongoose';
import { AUDIT_EVENTS } from '../constants/auth.constants.js';

const { Schema } = mongoose;

const loginAuditSchema = new Schema(
  {
    userId: {
      type:  Schema.Types.ObjectId,
      ref:   'User',
      default: null, // null on failed attempt where user is not found
      index: true,
    },
    tenantId: {
      type:    Schema.Types.ObjectId,
      ref:     'Tenant',
      default: null,
      index:   true,
    },
    email: {
      type:      String,
      lowercase: true,
      default:   null, // capture the email attempted even on failure
    },
    event: {
      type:    String,
      enum:    Object.values(AUDIT_EVENTS),
      required: true,
      index:   true,
    },
    success: {
      type:    Boolean,
      required: true,
      index:   true,
    },
    // Failure reason — never expose to the user, only internal use
    failureReason: {
      type:    String,
      default: null,
    },
    // Request metadata
    ip: {
      type:    String,
      default: null,
    },
    userAgent: {
      type:    String,
      default: null,
    },
    // Parsed from userAgent for quick display
    device: {
      platform: { type: String, default: null },
      browser:  { type: String, default: null },
      os:       { type: String, default: null },
    },
    sessionId: {
      type:    String,
      default: null,
    },
    // Geo info — Specification Required (MaxMind or IP-API integration)
    location: {
      country: { type: String, default: null },
      city:    { type: String, default: null },
    },
  },
  {
    // createdAt is the event timestamp — immutable audit log
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound: recent failed logins per user for lockout logic
loginAuditSchema.index({ userId: 1, success: 1, createdAt: -1 });
// Recent activity per tenant for Super Admin security view
loginAuditSchema.index({ tenantId: 1, createdAt: -1 });
// Suspicious IP lookups
loginAuditSchema.index({ ip: 1, success: 1, createdAt: -1 });

export default mongoose.model('LoginAudit', loginAuditSchema, 'login_audits');