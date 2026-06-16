import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  body:     { type: String, default: '' },
  isRead:   { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
});

notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);