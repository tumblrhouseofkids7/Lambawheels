const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: true
  },
  foreman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  shiftType: {
    type: String,
    enum: ['Day', 'Night']
  },
  attendance: {
    type: String,
    enum: ['Present', 'Absent']
  },
  inTime: {
    type: String
  },
  outTime: {
    type: String
  },
  totalProduction: {
    type: Number,
    required: true,
    default: 0
  },
  targetProduction: {
    type: Number,
    required: true,
    default: 0
  },
  extraProduction: {
    type: Number,
    required: true,
    default: 0
  },
  reject1: {
    type: Number,
    default: 0
  },
  totalReject: {
    type: Number,
    default: 0
  },
  reject2: {
    type: Number,
    default: 0
  },
  reject3: {
    type: Number,
    default: 0
  },
  netProduction: {
    type: Number,
    required: true
  },
  jobType: {
    type: String,
    enum: ['Tyre', 'Molding', '4 Die', '6 Die', 'Simple', null],
    default: null
  },
  secondaryDieType: {
    type: String,
    enum: ['4 Die', '6 Die', 'Molding', null]
  },
  secondaryTargetProduction: {
    type: Number,
    default: 0
  },
  secondaryTotalProduction: {
    type: Number,
    default: 0
  },
  secondaryTotalReject: {
    type: Number,
    default: 0
  },
  secondaryReject2: {
    type: Number,
    default: 0
  },
  secondaryReject3: {
    type: Number,
    default: 0
  },
  lowProductionReason: {
    type: String
  },
  bonusRate: {
    type: Number,
    required: true // e.g., 0.05, 0.20, 0.25
  },
  bonusAmount: {
    type: Number,
    required: true
  },
  secondaryBonusAmount: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  advances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  finalSalary: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Auto calculate fields before save
// NOTE: async pre-hooks in modern Mongoose use Promise style (no next param)
productionSchema.pre('validate', async function () {
  const totProd = Number(this.totalProduction) || 0;
  const tarProd = Number(this.targetProduction) || 0;
  const tRej = Number(this.totalReject) || 0;

  this.netProduction = totProd - tRej;
  this.extraProduction = Math.max(0, totProd - tarProd);

  let lType = 'Simple';
  try {
    const Labour = require('./Labour');
    const labour = await Labour.findById(this.labour);
    if (labour && labour.labourType) lType = labour.labourType;
  } catch (err) {
    console.error("Error fetching Labour for production calculation:", err);
  }

  // Ensure lType is always a valid string
  if (!lType) lType = 'Simple';

  if (this.jobType && (this.jobType === '4 Die' || this.jobType === '6 Die')) {
    lType = this.jobType;
  }

  let primaryBonus = 0;
  if (lType === '4 Die') {
    if (totProd >= tarProd && tarProd > 0) {
      const extra = Math.max(0, totProd - tarProd);
      primaryBonus = 30 + Math.floor(extra / 8) * 10;
    }
  } else if (lType === '6 Die') {
    if (totProd >= tarProd && tarProd > 0) {
      const extra = Math.max(0, totProd - tarProd);
      primaryBonus = 40 + Math.floor(extra / 12) * 15;
    }
  } else {
    primaryBonus = totProd * (Number(this.bonusRate) || 0);
  }

  let secondaryBonus = 0;
  if (this.secondaryDieType === '4 Die') {
    const secTotProd = Number(this.secondaryTotalProduction) || 0;
    const secTarProd = Number(this.secondaryTargetProduction) || 0;
    if (secTotProd >= secTarProd && secTarProd > 0) {
      const extra = Math.max(0, secTotProd - secTarProd);
      secondaryBonus = 30 + Math.floor(extra / 8) * 10;
    }
  } else if (this.secondaryDieType === '6 Die') {
    const secTotProd = Number(this.secondaryTotalProduction) || 0;
    const secTarProd = Number(this.secondaryTargetProduction) || 0;
    if (secTotProd >= secTarProd && secTarProd > 0) {
      const extra = Math.max(0, secTotProd - secTarProd);
      secondaryBonus = 40 + Math.floor(extra / 12) * 15;
    }
  }

  this.secondaryBonusAmount = secondaryBonus;
  this.bonusAmount = primaryBonus + secondaryBonus;

  const adv = Number(this.advances) || 0;
  const ded = Number(this.deductions) || 0;

  this.finalSalary = this.bonusAmount - adv - ded;

  if (isNaN(this.netProduction)) this.netProduction = 0;
  if (isNaN(this.extraProduction)) this.extraProduction = 0;
  if (isNaN(this.bonusAmount)) this.bonusAmount = 0;
  if (isNaN(this.secondaryBonusAmount)) this.secondaryBonusAmount = 0;
  if (isNaN(this.finalSalary)) this.finalSalary = 0;
});

const Production = mongoose.model('Production', productionSchema);
module.exports = Production;
