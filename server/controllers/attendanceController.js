const User = require('../models/User');
const Shift = require('../models/Shift');
const Production = require('../models/Production');

// @desc  Get attendance for all staff and labour for a date range
// @route GET /api/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access superadmin
exports.getAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate required' });

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Calculate total days in range
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((end - start) / msPerDay) + 1;

    // ── Staff: foremen + accountants (exclude superadmin) ──
    const allUsers = await User.find({ role: { $in: ['foreman', 'accountant'] } }).select('name email role');

    // Get ALL shifts in date range
    const shifts = await Shift.find({ date: { $gte: start, $lte: end } })
      .populate('foreman', 'name email role');

    // Aggregate by userId → count days present + collect daily info
    const shiftByUser = {};
    shifts.forEach(s => {
      const uid = s.foreman?._id?.toString();
      if (!uid) return;
      if (!shiftByUser[uid]) shiftByUser[uid] = { days: [], totalShifts: 0 };
      shiftByUser[uid].days.push({
        date: s.date,
        shiftType: s.shiftType,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
      });
      shiftByUser[uid].totalShifts++;
    });

    const staffAttendance = allUsers.map(u => {
      const uid = u._id.toString();
      const record = shiftByUser[uid] || { days: [], totalShifts: 0 };
      return {
        _id: uid,
        name: u.name,
        email: u.email,
        role: u.role,
        presentDays: record.totalShifts,
        absentDays: totalDays - record.totalShifts,
        totalDays,
        days: record.days,
      };
    });

    // ── Labour: from Production records ──
    const productions = await Production.find({ date: { $gte: start, $lte: end } })
      .populate('labour', 'name gender role')
      .populate('foreman', 'name');

    // Aggregate by labourId
    const labourMap = {};
    productions.forEach(p => {
      const lid = p.labour?._id?.toString();
      if (!lid) return;
      if (!labourMap[lid]) {
        labourMap[lid] = {
          _id: lid,
          name: p.labour?.name || 'Unknown',
          gender: p.labour?.gender || '',
          role: p.labour?.role || 'Labour',
          foreman: p.foreman?.name || '—',
          presentDays: 0,
          absentDays: 0,
          totalDays,
          totalProduction: 0,
          netProduction: 0,
          days: [],
        };
      }
      if (p.attendance === 'Present') {
        labourMap[lid].presentDays++;
        labourMap[lid].totalProduction += p.totalProduction || 0;
        labourMap[lid].netProduction += p.netProduction || 0;
      } else {
        labourMap[lid].absentDays++;
      }
      labourMap[lid].days.push({
        date: p.date,
        attendance: p.attendance,
        shiftType: p.shiftType,
        inTime: p.inTime,
        outTime: p.outTime,
      });
    });

    res.json({
      staffAttendance,
      labourAttendance: Object.values(labourMap),
      totalDays,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};
