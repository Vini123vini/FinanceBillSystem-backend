const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  sku:         { type: String, uppercase: true, trim: true },
  category:    { type: String, default: 'general' },
  type:        { type: String, enum: ['product','service'], default: 'service' },
  rate:        { type: Number, required: true, min: 0 },
  unit:        { type: String, default: 'unit' },
  taxRate:     { type: Number, default: 18 },
  stock:       { type: Number, default: 0 },
  trackStock:  { type: Boolean, default: false },
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
