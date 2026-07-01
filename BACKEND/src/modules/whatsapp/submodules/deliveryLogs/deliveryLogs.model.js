/**
 * WhatsApp Delivery Logs — model.
 *
 * One DeliveryLog per outbound (or webhook-tracked inbound) WhatsApp message.
 *
 * NOTE ON MODEL NAME:
 * The legacy module at src/modules/whatsapp/delivery-logs already registers
 * mongoose.model('WhatsAppDeliveryLog'). To avoid an OverwriteModelError this
 * fuller module registers a distinct model name: 'WhatsAppDeliveryLogV2'
 * (collection: whatsappdeliverylogv2s). Both can coexist; new outbound logging
 * should target this one.
 */
import mongoose from 'mongoose';
import {
  DIRECTION,
  DIRECTION_VALUES,
  MESSAGE_TYPE,
  MESSAGE_TYPE_VALUES,
  DELIVERY_STATUS,
  DELIVERY_STATUS_VALUES,
  FAILURE_REASON_VALUES,
  PROVIDER_VALUES,
  SOURCE,
  SOURCE_VALUES,
} from './deliveryLogs.constants.js';

const { Schema } = mongoose;

// ── Webhook event sub-schema ───────────────────────────────────────────────────
const webhookEventSchema = new Schema(
  {
    status:          { type: String, default: '' },
    timestamp:       { type: Date, default: Date.now },
    providerPayload: { type: Schema.Types.Mixed, default: {} },
    receivedAt:      { type: Date, default: Date.now },
  },
  { _id: false },
);

const deliveryLogSchema = new Schema(
  {
    tenantId: { type: String, required: true },

    // Linkage to message / conversation / contact / lead.
    messageId:      { type: Schema.Types.ObjectId, ref: 'WhatsAppMessage', default: null },
    conversationId: { type: Schema.Types.ObjectId, ref: 'WhatsAppConversation', default: null },
    contactId:      { type: Schema.Types.ObjectId, ref: 'WhatsAppContact', default: null },
    leadId:         { type: Schema.Types.ObjectId, ref: 'Lead', default: null },

    // Linkage to the originating module (any may be null).
    campaignId:       { type: Schema.Types.ObjectId, ref: 'WhatsAppCampaign', default: null },
    broadcastId:      { type: Schema.Types.ObjectId, ref: 'WhatsAppBroadcast', default: null },
    automationRuleId: { type: Schema.Types.ObjectId, ref: 'AutomationRule', default: null },
    templateId:       { type: Schema.Types.ObjectId, ref: 'WhatsAppTemplate', default: null },

    // Denormalised search helpers (filled at creation when known).
    contactName: { type: String, default: '' },
    leadName:    { type: String, default: '' },

    // What kind of message and where it came from.
    source: { type: String, enum: SOURCE_VALUES, default: SOURCE.OTHER },

    provider:          { type: String, enum: PROVIDER_VALUES, required: true },
    providerMessageId: { type: String, default: null },
    phoneNumber:       { type: String, required: true, trim: true },

    direction:   { type: String, enum: DIRECTION_VALUES, default: DIRECTION.OUTBOUND },
    messageType: { type: String, enum: MESSAGE_TYPE_VALUES, default: MESSAGE_TYPE.TEXT },

    status: { type: String, enum: DELIVERY_STATUS_VALUES, default: DELIVERY_STATUS.QUEUED },

    failureReason: { type: String, enum: FAILURE_REASON_VALUES, default: null },
    failureCode:   { type: String, default: null },
    retryCount:    { type: Number, default: 0, min: 0 },

    // Lifecycle timestamps.
    sentAt:      { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt:      { type: Date, default: null },
    failedAt:    { type: Date, default: null },

    webhookEvents:    { type: [webhookEventSchema], default: [] },
    providerMetadata: { type: Schema.Types.Mixed, default: {} },

    createdBy: { type: String, default: null },
  },
  {
    timestamps: true,   // createdAt + updatedAt
    versionKey: false,
  },
);

deliveryLogSchema.index({ tenantId: 1, status: 1 });
deliveryLogSchema.index({ tenantId: 1, provider: 1 });
deliveryLogSchema.index({ tenantId: 1, campaignId: 1 });
deliveryLogSchema.index({ tenantId: 1, broadcastId: 1 });
deliveryLogSchema.index({ tenantId: 1, automationRuleId: 1 });
deliveryLogSchema.index({ tenantId: 1, contactId: 1 });
deliveryLogSchema.index({ tenantId: 1, phoneNumber: 1 });
deliveryLogSchema.index({ tenantId: 1, providerMessageId: 1 });
deliveryLogSchema.index({ tenantId: 1, createdAt: -1 });

export const DeliveryLog = mongoose.model('WhatsAppDeliveryLogV2', deliveryLogSchema);
