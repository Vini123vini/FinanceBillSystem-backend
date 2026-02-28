const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 0 },
  rate:        { type: Number, required: true, min: 0 },
  taxRate:     { type: Number, default: 0 },
  amount:      { type: Number },
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceNumber: { type: String, required: true },
  status:        { type: String, enum: ['draft','sent','pending','paid','overdue','cancelled'], default: 'draft' },
  issueDate:     { type: Date, default: Date.now },
  dueDate:       { type: Date },
  lineItems:     [lineItemSchema],
  subtotal:      { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },
  discountType:  { type: String, enum: ['percent','fixed'], default: 'percent' },
  discountValue: { type: Number, default: 0 },
  discountAmount:{ type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  amountPaid:    { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  notes:         { type: String },
  terms:         { type: String },
  currency:      { type: String, default: 'INR' },
}, { timestamps: true });

invoiceSchema.pre('save', function (next) {
  this.subtotal = this.lineItems.reduce((s, i) => {
    i.amount = i.quantity * i.rate;
    return s + i.amount;
  }, 0);
  this.taxAmount = this.lineItems.reduce((s, i) => s + (i.amount * (i.taxRate / 100)), 0);
  if (this.discountType === 'percent') {
    this.discountAmount = (this.subtotal + this.taxAmount) * (this.discountValue / 100);
  } else {
    this.discountAmount = this.discountValue || 0;
  }
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  this.balanceDue  = Math.max(0, this.totalAmount - this.amountPaid);
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
