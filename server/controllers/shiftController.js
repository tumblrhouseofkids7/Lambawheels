const Shift = require('../models/Shift');
const Production = require('../models/Production');
const User = require('../models/User');

const startShift = async (req, res) => {
  try {
    const { shiftType, date } = req.body;
    const shiftDate = date ? new Date(date) : new Date();
    
    // Create start and end of the requested day
    const startOfDay = new Date(shiftDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(shiftDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if a shift of the SAME type already exists for this day
    const existingShift = await Shift.findOne({
      foreman: req.user._id,
      shiftType,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingShift) {
      return res.status(400).json({ message: `A ${shiftType} shift already exists for this date.` });
    }

    // Check if there is ANY Active shift for this day
    const activeShift = await Shift.findOne({
      foreman: req.user._id,
      status: 'Active',
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (activeShift) {
      return res.status(400).json({ message: 'Another shift is currently active for this date. Please end it first.' });
    }

    const shift = new Shift({
      foreman: req.user._id,
      shiftType,
      date: shiftDate,
      startTime: shiftDate,
    });
    const createdShift = await shift.save();
    res.status(201).json(createdShift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ foreman: req.user._id, status: 'Active' });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, foreman: req.user._id, status: 'Active' });
    if (!shift) {
      return res.status(404).json({ message: 'Active shift not found' });
    }
    shift.status = 'Completed';
    shift.endTime = new Date();
    await shift.save();
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resumeShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, foreman: req.user._id, status: 'Completed' });
    if (!shift) {
      return res.status(404).json({ message: 'Completed shift not found' });
    }
    
    // Check if another shift is currently active for this date
    const start = new Date(shift.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(shift.date);
    end.setHours(23, 59, 59, 999);
    
    const activeShift = await Shift.findOne({
      foreman: req.user._id,
      status: 'Active',
      date: { $gte: start, $lte: end }
    });

    if (activeShift) {
      return res.status(400).json({ message: 'Another shift is already active for this date.' });
    }

    shift.status = 'Active';
    shift.endTime = undefined;
    await shift.save();
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyShiftForDate = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    const start = new Date(queryDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(queryDate);
    end.setHours(23, 59, 59, 999);

    const shift = await Shift.findOne({
      foreman: req.user._id,
      date: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });
    
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShiftHistory = async (req, res) => {
  try {
    const { date } = req.query;
    let query = { foreman: req.user._id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const shifts = await Shift.find(query).sort({ date: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all foremen shifts for a specific date (accountant view)
// @route GET /api/shifts/fordate?date=YYYY-MM-DD
// @access accountant, superadmin
const getShiftsForDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param required' });

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const shifts = await Shift.find({ date: { $gte: start, $lte: end } })
      .populate('foreman', 'name email')
      .sort({ shiftType: 1, createdAt: 1 });

    // For each shift, fetch total production for that foreman on that date
    // Filter out orphaned shifts where the foreman user no longer exists
    const validShifts = shifts.filter((shift) => shift.foreman != null);

    const results = await Promise.all(
      validShifts.map(async (shift) => {
        const productions = await Production.find({
          foreman: shift.foreman._id,
          date: { $gte: start, $lte: end },
        });
        const totalProduction = productions.reduce((sum, p) => sum + (p.netProduction || 0), 0);
        return {
          _id: shift._id,
          foremanId: shift.foreman._id,
          foremanName: shift.foreman.name,
          foremanEmail: shift.foreman.email,
          shiftType: shift.shiftType,
          status: shift.status,
          startTime: shift.startTime,
          endTime: shift.endTime,
          date: shift.date,
          totalProduction,
        };
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startShift, getActiveShift, endShift, resumeShift, getShiftHistory, getShiftsForDate, getMyShiftForDate };
