const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientCode: {
    type: String,
    unique: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  ABN: {
    type: String,
    trim: true
  },
  TFN: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending_approval'],
    default: 'active'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

clientSchema.index({ assignedAgent: 1, status: 1 });
clientSchema.index({ assignedManager: 1 });
clientSchema.index({ status: 1 });

clientSchema.pre('save', async function (next) {
  if (!this.isNew || this.clientCode) return next();
  const count = await mongoose.model('Client').countDocuments();
  this.clientCode = `CLT-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Client', clientSchema);
