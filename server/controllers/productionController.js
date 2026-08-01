const Production = require('../models/Production');

// @desc    Get all production entries
// @route   GET /api/production
// @access  Private
const getProductions = async (req, res) => {
  try {
    let query = {};
    // Allowed all foremen to see all productions

    const { date, startDate, endDate, shift } = req.query;
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      query.date = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $lte: end };
    }

    if (shift) {
      query.shiftType = shift;
    }

    const productions = await Production.find(query)
      .populate('labour', 'name gender image labourType')
      .populate('foreman', 'name')
      .sort({ date: -1 });

    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add production entry
// @route   POST /api/production
// @access  Private (Foreman, Superadmin)
const addProduction = async (req, res) => {
  try {
    const {
      labour,
      date,
      shiftType,
      attendance,
      inTime,
      outTime,
      targetProduction,
      totalProduction,
      totalReject,
      reject1,
      reject2,
      reject3,
      bonusRate,
      overtimeHours,
      advances,
      deductions,
      secondaryDieType,
      secondaryTargetProduction,
      secondaryTotalProduction,
      secondaryTotalReject,
      secondaryReject2,
      secondaryReject3,
      lowProductionReason
    } = req.body;

    const production = new Production({
      labour,
      foreman: req.user._id,
      date: date ? new Date(date) : new Date(),
      shiftType,
      attendance,
      inTime,
      outTime,
      targetProduction: targetProduction || 0,
      totalProduction: totalProduction || 0,
      totalReject: totalReject || 0,
      reject1: reject1 || 0,
      reject2: reject2 || 0,
      reject3: reject3 || 0,
      bonusRate,
      overtimeHours: overtimeHours || 0,
      advances: advances || 0,
      deductions: deductions || 0,
      secondaryDieType: secondaryDieType === '' ? null : secondaryDieType,
      secondaryTargetProduction: secondaryTargetProduction || 0,
      secondaryTotalProduction: secondaryTotalProduction || 0,
      secondaryTotalReject: secondaryTotalReject || 0,
      secondaryReject2: secondaryReject2 || 0,
      secondaryReject3: secondaryReject3 || 0,
      lowProductionReason
    });

    // Final calculations are done in pre-save middleware of Production model
    const createdProduction = await production.save();

    // Populate before sending response to get names
    await createdProduction.populate('labour', 'name');

    res.status(201).json(createdProduction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update production entry
// @route   PUT /api/production/:id
// @access  Private (Foreman, Superadmin)
const updateProduction = async (req, res) => {
  try {
    const {
      shiftType,
      attendance,
      inTime,
      outTime,
      targetProduction,
      totalProduction,
      totalReject,
      reject1,
      reject2,
      reject3,
      bonusRate,
      overtimeHours,
      advances,
      deductions,
      secondaryDieType,
      secondaryTargetProduction,
      secondaryTotalProduction,
      secondaryTotalReject,
      secondaryReject2,
      secondaryReject3,
      lowProductionReason
    } = req.body;

    const production = await Production.findById(req.params.id);

    if (!production) {
      return res.status(404).json({ message: 'Production entry not found' });
    }

    if (shiftType !== undefined) production.shiftType = shiftType;
    if (attendance !== undefined) production.attendance = attendance;
    if (inTime !== undefined) production.inTime = inTime;
    if (outTime !== undefined) production.outTime = outTime;
    if (targetProduction !== undefined) production.targetProduction = targetProduction === '' ? 0 : targetProduction;
    if (totalProduction !== undefined) production.totalProduction = totalProduction === '' ? 0 : totalProduction;
    if (totalReject !== undefined) production.totalReject = totalReject === '' ? 0 : totalReject;
    if (reject1 !== undefined) production.reject1 = reject1 === '' ? 0 : reject1;
    if (reject2 !== undefined) production.reject2 = reject2 === '' ? 0 : reject2;
    if (reject3 !== undefined) production.reject3 = reject3 === '' ? 0 : reject3;
    if (bonusRate !== undefined) production.bonusRate = bonusRate === '' ? 0 : bonusRate;
    if (overtimeHours !== undefined) production.overtimeHours = overtimeHours === '' ? 0 : overtimeHours;
    if (advances !== undefined) production.advances = advances === '' ? 0 : advances;
    if (deductions !== undefined) production.deductions = deductions === '' ? 0 : deductions;
    if (secondaryDieType !== undefined) production.secondaryDieType = secondaryDieType === '' ? null : secondaryDieType;
    if (secondaryTargetProduction !== undefined) production.secondaryTargetProduction = secondaryTargetProduction === '' ? 0 : secondaryTargetProduction;
    if (secondaryTotalProduction !== undefined) production.secondaryTotalProduction = secondaryTotalProduction === '' ? 0 : secondaryTotalProduction;
    if (secondaryTotalReject !== undefined) production.secondaryTotalReject = secondaryTotalReject === '' ? 0 : secondaryTotalReject;
    if (secondaryReject2 !== undefined) production.secondaryReject2 = secondaryReject2 === '' ? 0 : secondaryReject2;
    if (secondaryReject3 !== undefined) production.secondaryReject3 = secondaryReject3 === '' ? 0 : secondaryReject3;
    if (lowProductionReason !== undefined) production.lowProductionReason = lowProductionReason;

    const updatedProduction = await production.save();
    await updatedProduction.populate('labour', 'name');

    res.json(updatedProduction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProductions, addProduction, updateProduction };
