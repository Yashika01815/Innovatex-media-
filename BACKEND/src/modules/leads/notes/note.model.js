import mongoose from 'mongoose';

const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    lead_id: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    author: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const LeadNote = mongoose.model('LeadNote', noteSchema);
