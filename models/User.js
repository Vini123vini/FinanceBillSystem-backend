const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String, default: '' },
  business: {
    name:    { type: String, default: '' },
    address: { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    gstin:   { type: String, default: '' },
  },
  invoiceSettings: {
    prefix:         { type: String, default: 'INV' },
    nextNumber:     { type: Number, default: 1 },
    defaultDueDays: { type: Number, default: 30 },
    defaultTaxRate: { type: Number, default: 18 },
    defaultNotes:   { type: String, default: 'Thank you for your business.' },
    currencySymbol: { type: String, default: '₹' },
  },
  notifications: {
    invoiceSent:      { type: Boolean, default: true },
    paymentReceived:  { type: Boolean, default: true },
    invoiceOverdue:   { type: Boolean, default: true },
    weeklyReport:     { type: Boolean, default: false },
    monthlyReport:    { type: Boolean, default: true },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
