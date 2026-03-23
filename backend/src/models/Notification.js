const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['request_created', 'assigned', 'recce_completed', 'approved', 'rejected',
           'assigned_to_vendor', 'work_completed', 'comment', 'status_change'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandingRequest' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
