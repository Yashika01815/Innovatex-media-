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
  // WhatsApp Inbox module
  WHATSAPP_ASSIGNED: 'WhatsApp Conversation Assigned',
  WHATSAPP_STATUS_CHANGED: 'WhatsApp Status Changed',
  WHATSAPP_MESSAGE_SENT: 'WhatsApp Message Sent',
  WHATSAPP_REPLY_RECEIVED: 'WhatsApp Reply Received',
  // WhatsApp Contacts module
  WHATSAPP_CONTACT_CREATED: 'WhatsApp Contact Created',
  WHATSAPP_CONTACT_UPDATED: 'WhatsApp Contact Updated',
  WHATSAPP_CONTACT_ASSIGNED: 'WhatsApp Contact Assigned',
  WHATSAPP_CONTACT_OPTED_OUT: 'WhatsApp Contact Opted Out',
  WHATSAPP_CONTACT_CONSENT_UPDATED: 'WhatsApp Contact Consent Updated',
  WHATSAPP_CONTACT_TAG_ADDED: 'WhatsApp Contact Tag Added',
  WHATSAPP_CONTACT_TAG_REMOVED: 'WhatsApp Contact Tag Removed',
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