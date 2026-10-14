const Production = require('../models/Production');
const Labour = require('../models/Labour');
const User = require('../models/User');
const Dispatch = require('../models/Dispatch');

// @desc    Get dashboard summary
// @route   GET /api/reports/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const totalLabours = await Labour.countDocuments();

    // Count all registered foremen/thakdars (users with role='foreman')
    const totalForemen = await User.countDocuments({ role: 'foreman' });

    // Count unique thakdars actively managing labours (distinct assignedForeman in Labour)
    const uniqueThakdars = await Labour.distinct('assignedForeman');
    const totalThakdar = uniqueThakdars.length;

    const productionStats = await Production.aggregate([
      {
        $lookup: {
          from: 'labours',
          localField: 'labour',
          foreignField: '_id',
          as: 'labourDetails'
        }
      },
      { $unwind: { path: '$labourDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalProduction: {
            $sum: {
              $add: [
                { $ifNull: ['$totalProduction', 0] },
                { $ifNull: ['$secondaryTotalProduction', 0] }
              ]
            }
          },
          totalSalary: { $sum: '$finalSalary' },
          count: { $sum: 1 },
          moldingProduction: {
            $sum: {
              $cond: [ { $eq: ['$labourDetails.labourType', 'Molding'] }, '$netProduction', 0 ]
            }
          },
          fourDieProduction: {
            $sum: {
              $add: [
                { $cond: [ { $eq: ['$labourDetails.labourType', '4 Die'] }, { $ifNull: ['$totalProduction', 0] }, 0 ] },
                { $cond: [ { $eq: ['$secondaryDieType', '4 Die'] }, { $ifNull: ['$secondaryTotalProduction', 0] }, 0 ] }
              ]
            }
          },
          sixDieProduction: {
            $sum: {
              $add: [
                { $cond: [ { $eq: ['$labourDetails.labourType', '6 Die'] }, { $ifNull: ['$totalProduction', 0] }, 0 ] },
                { $cond: [ { $eq: ['$secondaryDieType', '6 Die'] }, { $ifNull: ['$secondaryTotalProduction', 0] }, 0 ] }
              ]
            }
          }
        }
      }
    ]);

    const totalProduction = productionStats.length > 0 ? productionStats[0].totalProduction : 0;
    const totalSalary = productionStats.length > 0 ? productionStats[0].totalSalary : 0;
    const productionCount = productionStats.length > 0 ? productionStats[0].count : 0;
    const avgProduction = productionCount > 0 ? totalProduction / productionCount : 0;
    const moldingProduction = productionStats.length > 0 ? productionStats[0].moldingProduction : 0;
    const fourDieProduction = productionStats.length > 0 ? productionStats[0].fourDieProduction : 0;
    const sixDieProduction = productionStats.length > 0 ? productionStats[0].sixDieProduction : 0;
    const tyreProduction = totalProduction - moldingProduction;

    res.json({
      totalLabours,
      totalForemen,
      totalThakdar,
      totalProduction,
      totalSalary,
      avgProduction,
      moldingProduction,
      tyreProduction,
      fourDieProduction,
      sixDieProduction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get detailed reports (Labour or Thakdar) based on date range
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { type = 'labour', startDate, endDate, foreman } = req.query;
    
    // Base match for dates
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.date = { 
        $gte: new Date(`${startDate}T00:00:00.000Z`), 
        $lte: new Date(`${endDate}T23:59:59.999Z`) 
      };
    } else if (startDate) {
      matchStage.date = { $gte: new Date(`${startDate}T00:00:00.000Z`) };
    } else if (endDate) {
      matchStage.date = { $lte: new Date(`${endDate}T23:59:59.999Z`) };
    }

    // Optional Foreman filter
    if (foreman) {
      const mongoose = require('mongoose');
      matchStage.foreman = new mongoose.Types.ObjectId(foreman);
    }

    let records = [];
    let summary = {};

    if (type === 'labour') {
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$labour',
            totalProduction: { $sum: '$netProduction' },
            totalBonus: { $sum: '$bonusAmount' },
            totalOvertime: { $sum: '$overtimePay' },
            presentDays: {
              $sum: { $cond: [{ $eq: ['$attendance', 'Present'] }, 1, 0] }
            },
            absentDays: {
              $sum: { $cond: [{ $eq: ['$attendance', 'Absent'] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'labours',
            localField: '_id',
            foreignField: '_id',
            as: 'labourDetails'
          }
        },
        { $unwind: '$labourDetails' },
        {
          $project: {
            _id: 1,
            labourName: '$labourDetails.name',
            gender: '$labourDetails.gender',
            role: '$labourDetails.role',
            totalProduction: 1,
            totalBonus: 1,
            totalOvertime: 1,
            presentDays: 1,
            absentDays: 1,
            totalDays: { $add: ['$presentDays', '$absentDays'] }
          }
        },
        { $sort: { labourName: 1 } }
      ];

      records = await Production.aggregate(pipeline);
      
      summary = {
        totalProduction: records.reduce((sum, r) => sum + r.totalProduction, 0),
        totalBonus: records.reduce((sum, r) => sum + r.totalBonus, 0),
        totalOvertime: records.reduce((sum, r) => sum + r.totalOvertime, 0)
      };
    } else if (type === 'thakdar') {
      // Thakdar report: worker name, product name, foreman, quantity
      const dispatchMatch = {};
      if (startDate && endDate) {
        dispatchMatch.date = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        dispatchMatch.date = { $gte: startDate };
      } else if (endDate) {
        dispatchMatch.date = { $lte: endDate };
      }

      const pipeline = [
        { $match: dispatchMatch },
        { $unwind: '$entries' }
      ];

      if (foreman) {
        const mongoose = require('mongoose');
        pipeline.push({
          $match: { 'entries.foremanId': new mongoose.Types.ObjectId(foreman) }
        });
      }

      pipeline.push(
        {
          $group: {
            _id: {
              labourId: '$entries.labourId',
              productName: '$productName',
              foremanId: '$entries.foremanId'
            },
            workerName: { $first: '$entries.labourName' },
            gender: { $first: '$entries.gender' },
            productName: { $first: '$productName' },
            foremanName: { $first: '$entries.foremanName' },
            totalDispatchWork: { $sum: '$entries.quantity' },
            totalEntries: { $sum: 1 }
          }
        },
        { $sort: { foremanName: 1, workerName: 1, productName: 1 } }
      );

      records = await Dispatch.aggregate(pipeline);
      
      summary = {
        totalDispatchWork: records.reduce((sum, r) => sum + r.totalDispatchWork, 0)
      };
    }

    res.json({ records, summary });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDashboardSummary,
  getReports
};
