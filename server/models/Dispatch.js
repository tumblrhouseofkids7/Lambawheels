
const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour', default: null },
  labourName: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
  quantity: { type: Number, required: true, min: 0 },
  foremanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foremanName: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
}, { _id: true });

const dispatchSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  targetQty: { type: Number, default: 0 },
  date: { type: String, required: true },           // 'YYYY-MM-DD'
  shift: { type: String, enum: ['Day', 'Night'], required: true },
  // Assigned foreman (accountant picks who's on duty)
  foremanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  foremanName: { type: String, default: '' },
  // Party / Company this dispatch is for
  partyName: { type: String, default: '', trim: true },
  entries: { type: [entrySchema], default: [] },
  totalProduced: { type: Number, default: 0 },
  isSubmitted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Dispatch', dispatchSchema);
