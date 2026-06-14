/**
 * =============================================================================
 * InnovateX Revenue OS — EmailVerificationToken Model
 * =============================================================================
 *
 * FILE: src/modules/auth/models/EmailVerificationToken.js
 *
 * COLLECTION: email_verification_tokens
 * TTL: 24 hours
 * =============================================================================
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const emailVerificationTokenSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    email: {
      type:     String,
      required: true,
      lowercase: true,
    },
    tokenHash: {
      type:     String,
      required: true,
      unique:   true,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    isUsed: {
      type:    Boolean,
      default: false,
    },
    usedAt: {
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
        delete ret.tokenHash;
        return ret;
      },
    },
  }
);

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationTokenSchema.index({ userId: 1, isUsed: 1 });

export default mongoose.model('EmailVerificationToken', emailVerificationTokenSchema, 'email_verification_tokens');