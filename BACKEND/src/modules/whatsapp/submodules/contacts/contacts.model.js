import mongoose from 'mongoose';
import {
  CONSENT_STATUS,
  CONSENT_STATUS_VALUES,
  OPT_OUT_STATUS,
  OPT_OUT_STATUS_VALUES,
  CONTACT_STATUS,
  CONTACT_STATUS_VALUES,
  SCORE_MIN,
  SCORE_MAX,
} from './contacts.constants.js';

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    tenantId: { type: String, required: true },

    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppConversation',
      default: null,
    },

    name: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },

    source: { type: String, trim: true, default: '' },
    campaignSource: { type: String, trim: true, default: '' },
    campaignMedium: { type: String, trim: true, default: '' },
    campaignName: { type: String, trim: true, default: '' },

    score: { type: Number, default: 0, min: SCORE_MIN, max: SCORE_MAX },

    consentStatus: {
      type: String,
      enum: CONSENT_STATUS_VALUES,
      default: CONSENT_STATUS.UNKNOWN,
    },
    optOutStatus: {
      type: String,
      enum: OPT_OUT_STATUS_VALUES,
      default: OPT_OUT_STATUS.ACTIVE,
    },

    lastMessageAt: { type: Date, default: null },
    lastInboundAt: { type: Date, default: null },
    lastOutboundAt: { type: Date, default: null },

    tags: { type: [String], default: [] },

    assignedUserId: { type: String, default: null },
    assignedUserName: { type: String, default: null },

    status: {
      type: String,
      enum: CONTACT_STATUS_VALUES,
      default: CONTACT_STATUS.NEW,
    },

    notesCount: { type: Number, default: 0, min: 0 },
    unreadCount: { type: Number, default: 0, min: 0 },
    totalMessages: { type: Number, default: 0, min: 0 },

    lastContactedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    versionKey: false,
  },
);

// Tenant-scoped access patterns.
contactSchema.index({ tenantId: 1, phone: 1 });
contactSchema.index({ tenantId: 1, leadId: 1 });
contactSchema.index({ tenantId: 1, status: 1 });
contactSchema.index({ tenantId: 1, consentStatus: 1 });
contactSchema.index({ tenantId: 1, optOutStatus: 1 });
contactSchema.index({ tenantId: 1, assignedUserId: 1 });
contactSchema.index({ tenantId: 1, score: 1 });

export const WhatsAppContact = mongoose.model('WhatsAppContact', contactSchema);
