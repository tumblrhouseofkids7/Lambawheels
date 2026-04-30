const mongoose = require('mongoose');
const Salary = require('../models/Salary');
const Labour = require('../models/Labour');
const Production = require('../models/Production');
const Advance = require('../models/Advance');

// Helper to get attendance matrix for a date range
const buildAttendanceMatrix = async (startDate, endDate) => {
  const productions = await Production.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const matrix = {}; // { labourId: { 'YYYY-MM-DD': 'P' | 'A' } }

  productions.forEach(prod => {
    const labourId = prod.labour.toString();
    if (!matrix[labourId]) matrix[labourId] = {};

    const dateStr = new Date(prod.date).toISOString().split('T')[0];
    matrix[labourId][dateStr] = prod.attendance === 'Present' ? 'P' : 'A';
  });

  return matrix;
};

// @desc    Generate or update salary sheet for a given date range
// @route   POST /api/salary/generate
// @access  Private (Accountant/Superadmin)
exports.generateSalary = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const labours = await Labour.find({ role: 'Labour' });
    const productions = await Production.find({
      date: { $gte: start, $lte: end }
    });

    const salaryRecords = [];
    const attendanceMatrix = await buildAttendanceMatrix(start, end);

    for (const labour of labours) {
      const labourId = labour._id.toString();
      const labourProductions = productions.filter(
        p => p.labour.toString() === labourId
      );

      let presentDays = 0;
      let totalBonus = 0;
      let totalOvertimeHours = 0;

      labourProductions.forEach(prod => {
        if (prod.attendance === 'Present') {
          presentDays += 1;
        }
        totalBonus += (prod.bonusAmount || 0);
        totalOvertimeHours += (prod.overtimeHours || 0);
      });

      // Calculate Advances
      const undeductedAdvances = await Advance.find({ labour: labour._id, isDeducted: false });

      let calcCurrentAdvance = 0;
      let calcPreviousAdvance = 0;

      undeductedAdvances.forEach(adv => {
        if (adv.advanceType === 'Current') {
          calcCurrentAdvance += adv.amount;
        } else if (adv.advanceType === 'Previous') {
          calcPreviousAdvance += adv.amount;
        }
      });

      const basic = labour.basicSalary || 0;
      const oneDayRate = basic / 30;
      const oneHourRate = oneDayRate / 12;
      const otAmount = Math.round(oneHourRate * totalOvertimeHours);
      const basicEarned = basic; // User requested full basic, no prorating
      const salaryAmount = basicEarned + otAmount + totalBonus;

      let salaryRecord = await Salary.findOne({ labour: labour._id, startDate: start, endDate: end });

      if (salaryRecord) {
        salaryRecord.presentDays = presentDays;
        salaryRecord.bonus = totalBonus;
        salaryRecord.overtimeHours = totalOvertimeHours;
        salaryRecord.basicSalary = basic;
        salaryRecord.monthDays = 30; // Min 30 days logic
        
        if (salaryRecord.status === 'Pending') {
          salaryRecord.currentAdvance = calcCurrentAdvance;
          salaryRecord.previousAdvance = calcPreviousAdvance;
        }

        const finalNetPayable = salaryAmount - (salaryRecord.currentAdvance || 0) - (salaryRecord.previousAdvance || 0);

        // Only update salaryPaidAmount if it's currently 0 or we are refreshing the calculations
        if (salaryRecord.salaryPaidAmount === 0 || salaryRecord.status === 'Pending') {
          salaryRecord.salaryPaidAmount = finalNetPayable;
        }
        await salaryRecord.save();
      } else {
        const initialNetPayable = salaryAmount - calcCurrentAdvance - calcPreviousAdvance;
        salaryRecord = await Salary.create({
          labour: labour._id,
          startDate: start,
          endDate: end,
          basicSalary: basic,
          presentDays,
          overtimeHours: totalOvertimeHours,
          bonus: totalBonus,
          monthDays: 30,
          currentAdvance: calcCurrentAdvance,
          previousAdvance: calcPreviousAdvance,
          salaryPaidAmount: initialNetPayable
        });
      }

      await salaryRecord.populate('labour', 'name role labourType');

      const recordObj = salaryRecord.toObject();
      recordObj.attendance = attendanceMatrix[labourId] || {};
      salaryRecords.push(recordObj);
    }

    res.status(200).json(salaryRecords);
  } catch (error) {
    console.error('Error generating salary:', error);
    res.status(500).json({ message: 'Server error generating salary' });
  }
};

// @desc    Get salary sheet for a given date range
// @route   GET /api/salary
// @access  Private
exports.getSalarySheet = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const records = await Salary.find({ startDate: start, endDate: end }).populate('labour', 'name role labourType');
    const attendanceMatrix = await buildAttendanceMatrix(start, end);

    const mappedRecords = records
      .filter(record => record.labour && record.labour.role === 'Labour')
      .map(record => {
        const recordObj = record.toObject();
        const labourIdStr = record.labour ? record.labour._id.toString() : null;
        recordObj.attendance = labourIdStr ? (attendanceMatrix[labourIdStr] || {}) : {};

        // Dynamically calculate and fill salaryPaidAmount for Pending records
        if (recordObj.status === 'Pending' || !recordObj.salaryPaidAmount) {
          const basic = recordObj.basicSalary || 0;
          const oneDayRate = basic / 30;
          const oneHourRate = oneDayRate / 12;
          const otAmount = Math.round(oneHourRate * (recordObj.overtimeHours || 0));
          const basicEarned = basic; // User requested full basic, no prorating
          const salaryAmount = basicEarned + otAmount + (recordObj.bonus || 0);
          const netPayable = salaryAmount - (recordObj.currentAdvance || 0) - (recordObj.previousAdvance || 0);

          recordObj.salaryPaidAmount = netPayable;
        }

        return recordObj;
      });

    res.status(200).json(mappedRecords);
  } catch (error) {
    console.error('Error fetching salary sheet:', error);
    res.status(500).json({ message: 'Server error fetching salary sheet' });
  }
};

// @desc    Update specific salary record
// @route   PUT /api/salary/update/:id
// @access  Private
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Strip read-only / reference fields — sending the populated 'labour' object
    // via $set corrupts the MongoDB ObjectId reference (ObjectId → embedded object)
    const { labour: _labour, attendance: _attendance, ...safeUpdateData } = updateData;

    const salaryRecord = await Salary.findByIdAndUpdate(
      id,
      { $set: safeUpdateData },
      { returnDocument: 'after', runValidators: true }
    ).populate('labour', 'name role labourType');

    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // If basicSalary is updated in the salary sheet, fix it on the Labour profile
    if (safeUpdateData.basicSalary !== undefined && salaryRecord.labour) {
      await Labour.findByIdAndUpdate(salaryRecord.labour._id, {
        basicSalary: safeUpdateData.basicSalary
      });
    }

    // If status is updated to Paid, mark active advances as deducted
    if (updateData.status === 'Paid') {
      await Advance.updateMany(
        {
          labour: salaryRecord.labour._id,
          isDeducted: false
        },
        {
          $set: {
            isDeducted: true,
            deductedInSalaryId: salaryRecord._id
          }
        }
      );
    } else if (updateData.status === 'Pending') {
      // Revert if marked pending
      await Advance.updateMany(
        { deductedInSalaryId: salaryRecord._id },
        {
          $set: {
            isDeducted: false,
            deductedInSalaryId: null
          }
        }
      );
    }

    // Attach attendance so it doesn't break UI on row update
    const attendanceMatrix = await buildAttendanceMatrix(salaryRecord.startDate, salaryRecord.endDate);
    const recordObj = salaryRecord.toObject();
    recordObj.attendance = attendanceMatrix[salaryRecord.labour._id.toString()] || {};

    res.status(200).json(recordObj);
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ message: 'Server error updating salary' });
  }
};

// @desc    Get contractor (Thakadar) monthly salary based on production
// @route   GET /api/salary/contractor
// @access  Private
exports.getContractorSalary = async (req, res) => {
  try {
    const { month, startDate, endDate } = req.query;
    if (!month && (!startDate || !endDate)) {
      return res.status(400).json({ message: 'Provide startDate and endDate, or month parameter' });
    }

    const Labour = require('../models/Labour');
    const Dispatch = require('../models/Dispatch');

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = { $gte: startDate, $lte: endDate };
    } else if (month) {
      dateQuery = { $regex: `^${month}` };
    }

    // Get all Labours with role Thakdar
    const thakadars = await Labour.find({ role: { $regex: /^thakdar$/i } }).select('name gender dispatchRate');

    // Get dispatches for the date range
    const dispatches = await Dispatch.find({
      date: dateQuery
    }).lean();

    const contractorSalaries = thakadars.map(thakadar => {
      const workingDaysSet = new Set();
      let totalDispatch = 0;

      dispatches.forEach(d => {
        let dailyDispatch = 0;
        (d.entries || []).forEach(e => {
          if (e.labourName && e.labourName.toLowerCase() === thakadar.name.toLowerCase()) {
            dailyDispatch += (Number(e.quantity) || 0);
          }
        });

        if (dailyDispatch > 0) {
          workingDaysSet.add(d.date);
          totalDispatch += dailyDispatch;
        }
      });

      const dispatchRate = thakadar.dispatchRate || 0;
      const totalSalary = totalDispatch * dispatchRate;

      return {
        _id: thakadar._id,
        name: thakadar.name,
        gender: thakadar.gender || '—',
        email: '',
        workingDays: workingDaysSet.size,
        totalDispatch,
        dispatchRate,
        totalSalary
      };
    });

    res.status(200).json(contractorSalaries);
  } catch (error) {
    console.error('Error getting contractor salary:', error);
    res.status(500).json({ message: 'Server error fetching contractor salary' });
  }
};

// @desc    Update contractor (Thakadar) dispatch rate
// @route   PUT /api/salary/contractor/:id/rate
// @access  Private
exports.updateContractorRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatchRate } = req.body;

    if (dispatchRate === undefined || dispatchRate < 0) {
      return res.status(400).json({ message: 'Valid dispatch rate is required' });
    }

    const Labour = require('../models/Labour');
    const thakadar = await Labour.findOneAndUpdate(
      { _id: id, role: { $regex: /^thakdar$/i } },
      { $set: { dispatchRate: Number(dispatchRate) } },
      { returnDocument: 'after', runValidators: true }
    ).select('name dispatchRate');

    if (!thakadar) {
      return res.status(404).json({ message: 'Contractor (thakadar) not found' });
    }

    res.status(200).json(thakadar);
  } catch (error) {
    console.error('Error updating contractor rate:', error);
    res.status(500).json({ message: 'Server error updating contractor rate' });
  }
};
