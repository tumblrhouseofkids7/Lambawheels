const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: true
  },
  month: {
    type: Number, // Legacy, optional now
    required: false
  },
  year: {
    type: Number, // Legacy, optional now
    required: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  basicSalary: {
    type: Number,
    default: 0
  },
  monthDays: {
    type: Number,
    default: 30
  },
  presentDays: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeAmount: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  esi: {
    type: Number,
    default: 0
  },
  tds: {
    type: Number,
    default: 0
  },
  previousAdvance: {
    type: Number,
    default: 0
  },
  previousAdvanceNote: {
    type: String,
    default: ''
  },
  currentAdvance: {
    type: Number,
    default: 0
  },
  salaryPaidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  }
}, { timestamps: true });

// Compound index removed to allow flexible date ranges
// salarySchema.index({ labour: 1, month: 1, year: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;
