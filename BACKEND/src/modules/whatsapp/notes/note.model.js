import mongoose from 'mongoose';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppConversation',
      required: true,
      index: true,
    },
    body: { type: String, required: true, trim: true },
    created_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

export const WhatsAppNote = mongoose.model('WhatsAppNote', noteSchema);
