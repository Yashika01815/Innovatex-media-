import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Activity / timeline event types. */
// export const ACTIVITY_TYPE = Object.freeze({
//   LEAD_CREATED: 'Lead Created',
//   LEAD_UPDATED: 'Lead Updated',
//   LEAD_ASSIGNED: 'Lead Assigned',
//   LEAD_UNASSIGNED: 'Lead Unassigned',
//   LEAD_QUALIFIED: 'Lead Qualified',
//   NOTE_ADDED: 'Note Added',
//   LEAD_ARCHIVED: 'Lead Archived',
//   LEAD_CAPTURED: 'Lead Captured',
// }); // previous code

//Channged code
// export const ACTIVITY_TYPE = Object.freeze({
//   LEAD_CREATED: 'Lead Created',
//   LEAD_UPDATED: 'Lead Updated',
//   LEAD_ASSIGNED: 'Lead Assigned',
//   LEAD_UNASSIGNED: 'Lead Unassigned',
//   LEAD_QUALIFIED: 'Lead Qualified',
//   NOTE_ADDED: 'Note Added',
//   LEAD_ARCHIVED: 'Lead Archived',
//   LEAD_CAPTURED: 'Lead Captured',

//   WHATSAPP_MESSAGE_SENT: 'WhatsApp Message Sent',
//   WHATSAPP_REPLY_RECEIVED: 'WhatsApp Reply Received',
// });


export const ACTIVITY_TYPE = Object.freeze({
  LEAD_CREATED: 'Lead Created',
  LEAD_UPDATED: 'Lead Updated',
  LEAD_ASSIGNED: 'Lead Assigned',
  LEAD_UNASSIGNED: 'Lead Unassigned',
  LEAD_QUALIFIED: 'Lead Qualified',
  NOTE_ADDED: 'Note Added',
  LEAD_ARCHIVED: 'Lead Archived',
  LEAD_CAPTURED: 'Lead Captured',

  WHATSAPP_MESSAGE_SENT: 'WhatsApp Message Sent',
  WHATSAPP_REPLY_RECEIVED: 'WhatsApp Reply Received',

  WHATSAPP_ASSIGNED: 'WhatsApp Conversation Assigned',
  WHATSAPP_STATUS_CHANGED: 'WhatsApp Status Changed',
  BOOKING_CREATED:     'Booking Created',
  BOOKING_RESCHEDULED: 'Booking Rescheduled',
  BOOKING_COMPLETED:   'Booking Completed',
  BOOKING_CANCELLED:   'Booking Cancelled',
  BOOKING_NO_SHOW:     'Booking No Show',

  // ADD THIS — needed by call intelligence (next module)
  CALL_COMPLETED:      'Call Completed',
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
