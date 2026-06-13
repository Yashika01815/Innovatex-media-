import mongoose from 'mongoose';

const { Schema } = mongoose;

export const CONVERSATION_STATUS = Object.freeze({
  NEW: 'New',
  OPEN: 'Open',
  PENDING: 'Pending',
  QUALIFIED: 'Qualified',
  BOOKED: 'Booked',
  WON: 'Won',
  LOST: 'Lost',
  GHOSTED: 'Ghosted',
});

export const CONVERSATION_STATUS_VALUES = Object.freeze(
  Object.values(CONVERSATION_STATUS),
);

const conversationSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    lead_id: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },

    phone: { type: String, required: true, trim: true },
    contact_name: { type: String, trim: true, default: '' },

    assigned_user_id: { type: String, default: null, index: true },

    status: {
      type: String,
      enum: CONVERSATION_STATUS_VALUES,
      default: CONVERSATION_STATUS.NEW,
      index: true,
    },

    tags: { type: [String], default: [] },

    unread_count: { type: Number, default: 0, min: 0 },
    last_message_preview: { type: String, default: '' },
    last_message_at: { type: Date, default: null },

    archived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// Inbox listing + filtering patterns.
conversationSchema.index({ tenant_id: 1, archived: 1, last_message_at: -1 });
conversationSchema.index({ tenant_id: 1, phone: 1 });
conversationSchema.index({ tenant_id: 1, status: 1 });
conversationSchema.index({ tenant_id: 1, assigned_user_id: 1 });

export const Conversation = mongoose.model('WhatsAppConversation', conversationSchema);
