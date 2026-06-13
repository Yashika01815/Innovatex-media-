import mongoose from 'mongoose';

const { Schema } = mongoose;

export const MESSAGE_DIRECTION = Object.freeze({
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
});
export const MESSAGE_DIRECTION_VALUES = Object.freeze(
  Object.values(MESSAGE_DIRECTION),
);

export const MESSAGE_STATUS = Object.freeze({
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
});
export const MESSAGE_STATUS_VALUES = Object.freeze(Object.values(MESSAGE_STATUS));

export const MESSAGE_TYPE = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  TEMPLATE: 'template',
});
export const MESSAGE_TYPE_VALUES = Object.freeze(Object.values(MESSAGE_TYPE));

const messageSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppConversation',
      required: true,
      index: true,
    },
    lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },

    direction: { type: String, enum: MESSAGE_DIRECTION_VALUES, required: true },
    type: { type: String, enum: MESSAGE_TYPE_VALUES, default: MESSAGE_TYPE.TEXT },
    content: { type: String, default: '' },

    sender: { type: String, default: null },
    recipient: { type: String, default: null },

    provider: { type: String, default: 'simulation' },
    status: {
      type: String,
      enum: MESSAGE_STATUS_VALUES,
      default: MESSAGE_STATUS.QUEUED,
    },
    provider_message_id: { type: String, default: null },

    sent_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

messageSchema.index({ tenant_id: 1, conversation_id: 1, created_at: 1 });

export const Message = mongoose.model('WhatsAppMessage', messageSchema);
