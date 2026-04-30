const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  foreman: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shiftType: { type: String, enum: ['Day', 'Night'], required: true },
  date: { type: Date, default: Date.now },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
