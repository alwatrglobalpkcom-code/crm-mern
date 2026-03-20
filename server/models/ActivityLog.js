const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true, index: true },
  entity: { type: String, enum: ['user', 'client', 'task', 'document'], required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
  entityLabel: { type: String, trim: true }
}, {
  timestamps: true
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
