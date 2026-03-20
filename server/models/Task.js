const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  taskType: {
    type: String,
    enum: ['BAS', 'GST', 'Tax Return', 'Payroll'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

taskSchema.index({ client: 1, dueDate: 1 });
taskSchema.index({ assignedAgent: 1, status: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model('Task', taskSchema);
