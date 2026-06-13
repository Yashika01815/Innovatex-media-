import mongoose from 'mongoose';
import { MESSAGE_STATUS_VALUES } from '../messages/message.model.js';

const { Schema } = mongoose;

const deliveryLogSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppConversation',
      required: true,
      index: true,
    },
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppMessage',
      required: true,
      index: true,
    },

    provider: { type: String, default: 'simulation' },
    provider_message_id: { type: String, default: null },
    recipient: { type: String, default: null },

    status: { type: String, enum: MESSAGE_STATUS_VALUES, required: true },
    retries: { type: Number, default: 0, min: 0 },
    error: { type: String, default: null },

    // Transport timestamps (distinct from the record's created_at/updated_at).
    queued_at: { type: Date, default: null },
    sent_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

deliveryLogSchema.index({ tenant_id: 1, conversation_id: 1, created_at: -1 });

export const DeliveryLog = mongoose.model('WhatsAppDeliveryLog', deliveryLogSchema);
