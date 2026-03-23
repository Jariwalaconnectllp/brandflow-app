const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['marketplace', 'mis', 'recce', 'admin', 'vendor'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ROLES, required: true },
  phone: { type: String, trim: true },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  vendorDetails: {
    companyName: String,
    serviceArea: [String],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    completedJobs: { type: Number, default: 0 }
  },
  notifications: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
