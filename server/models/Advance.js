const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  advanceType: {
    type: String,
    enum: ['Previous', 'Current'],
    default: 'Current'
  },
  dateGiven: {
    type: Date,
    required: true
  },
  isDeducted: {
    type: Boolean,
    default: false
  },
  deductedInSalaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salary',
    default: null
  },
  note: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Advance', advanceSchema);
