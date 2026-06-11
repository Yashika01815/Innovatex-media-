import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Activity / timeline event types. */
export const ACTIVITY_TYPE = Object.freeze({
  LEAD_CREATED: 'Lead Created',
  LEAD_UPDATED: 'Lead Updated',
  LEAD_ASSIGNED: 'Lead Assigned',
  LEAD_QUALIFIED: 'Lead Qualified',
  NOTE_ADDED: 'Note Added',
  LEAD_ARCHIVED: 'Lead Archived',
  LEAD_CAPTURED: 'Lead Captured',
});

const activitySchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },
    lead_id: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    message: { type: String, default: '' },
    actor: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const LeadActivity = mongoose.model('LeadActivity', activitySchema);
