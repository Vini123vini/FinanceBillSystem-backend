const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoice:       { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  client:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount:        { type: Number, required: true, min: 0 },
  paymentDate:   { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['upi','neft','rtgs','bank_transfer','cheque','cash','card','other'], default: 'upi' },
  referenceNumber: { type: String },
  notes:         { type: String },
  status:        { type: String, enum: ['completed','pending','failed'], default: 'completed' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
