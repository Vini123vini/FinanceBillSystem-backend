const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  category:      { type: String, default: 'other' },
  amount:        { type: Number, required: true, min: 0 },
  date:          { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'cash' },
  vendor:        { type: String },
  notes:         { type: String },
  receiptUrl:    { type: String },
  taxAmount:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
