const mongoose = require('mongoose');

const STATUSES = [
  'created',
  'assigned_to_recce',
  'recce_in_progress',
  'recce_completed',
  'awaiting_approval',
  'approved',
  'rejected',
  'assigned_to_vendor',
  'work_in_progress',
  'work_completed'
];

const BRANDING_TYPES = [
  'Hoarding',
  'Flex Banner',
  'LED Signage',
  'Wall Painting',
  'Glow Sign Board',
  'Standee',
  'Vehicle Wrap',
  'Digital Display',
  'Neon Sign',
  'Other'
];

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByName: String,
  performedByRole: String,
  fromStatus: String,
  toStatus: String,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: String,
  caption: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  geoTag: {
    lat: Number,
    lng: Number,
    address: String
  }
});

const brandingRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  brandingType: { type: String, enum: BRANDING_TYPES, required: true },
  status: { type: String, enum: STATUSES, default: 'created' },

  // Location
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: String,
    landmark: String,
    coordinates: { lat: Number, lng: Number }
  },

  // Requirements
  requirements: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  targetDate: Date,

  // Team assignments
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedMIS: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedRecce: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Recce details
  recce: {
    notes: String,
    estimatedCost: Number,
    currency: { type: String, default: 'INR' },
    completedAt: Date,
    images: [imageSchema],
    siteCondition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    feasibility: { type: String, enum: ['feasible', 'feasible_with_changes', 'not_feasible'] }
  },

  // Approval
  approval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    comment: String,
    finalBudget: Number
  },

  // Vendor work
  vendorWork: {
    startedAt: Date,
    completedAt: Date,
    notes: String,
    images: [imageSchema],
    actualCost: Number
  },

  // SLA tracking
  sla: {
    createdAt: Date,
    assignedToRecceAt: Date,
    recceCompletedAt: Date,
    approvalDecisionAt: Date,
    assignedToVendorAt: Date,
    workCompletedAt: Date
  },

  // Attachments (initial request)
  attachments: [imageSchema],

  // Activity log
  activities: [activitySchema],

  // MIS notes
  misNotes: String,

  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate request number
brandingRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.requestNumber = `BR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    this.sla.createdAt = new Date();
  }
  next();
});

// Virtual for days since creation
brandingRequestSchema.virtual('ageDays').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for search performance
brandingRequestSchema.index({ status: 1 });
brandingRequestSchema.index({ 'location.city': 1 });
brandingRequestSchema.index({ createdBy: 1 });
brandingRequestSchema.index({ assignedRecce: 1 });
brandingRequestSchema.index({ assignedVendor: 1 });
brandingRequestSchema.index({ requestNumber: 1 });
brandingRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BrandingRequest', brandingRequestSchema);
module.exports.STATUSES = STATUSES;
module.exports.BRANDING_TYPES = BRANDING_TYPES;
