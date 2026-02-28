const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true, trim: true },
  email:   { type: String, trim: true, lowercase: true },
  phone:   { type: String, trim: true },
  company: { type: String, trim: true },
  gstin:   { type: String, trim: true, uppercase: true },
  address: { type: String },
  city:    { type: String },
  state:   { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' },
  status:  { type: String, enum: ['active','inactive'], default: 'active' },
  notes:   { type: String },
  color:   { type: String, default: '#7C6FFF' },
}, { timestamps: true, toJSON: { virtuals: true } });

clientSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
});

module.exports = mongoose.model('Client', clientSchema);
