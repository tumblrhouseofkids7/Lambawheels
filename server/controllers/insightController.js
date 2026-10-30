const Production = require('../models/Production');
const Labour = require('../models/Labour');
const User = require('../models/User');
const IncomingArticle = require('../models/IncomingArticle');
const OutgoingArticle = require('../models/OutgoingArticle');
const Dispatch = require('../models/Dispatch');

// @desc    Get executive insights (Top performers, target deficits, continuous downperformers, regular clients, vendor price hikes)
// @route   GET /api/insights/executive
// @access  Private (Superadmin)
exports.getExecutiveInsights = async (req, res) => {
  try {
    const { timeframe = 'all', startDate, endDate, minStreak = 2 } = req.query;

    // Build date filter for Production, Outgoing, Dispatch
    let prodDateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      prodDateFilter.date = { $gte: start, $lte: end };
    } else if (timeframe === 'today') {
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setUTCHours(23, 59, 59, 999);
      prodDateFilter.date = { $gte: start, $lte: end };
    } else if (timeframe === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setUTCHours(0, 0, 0, 0);
      prodDateFilter.date = { $gte: start };
    } else if (timeframe === 'month') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setUTCHours(0, 0, 0, 0);
      prodDateFilter.date = { $gte: start };
    }

    // ─────────────────────────────────────────────────────────────
    // 1. WORKER PERFORMANCE, TARGETS & CONTINUOUS DOWNPERFORMANCE
    // ─────────────────────────────────────────────────────────────
    const prodQuery = { attendance: 'Present', ...prodDateFilter };
    const prods = await Production.find(prodQuery)
      .populate('labour', 'name labourType role assignedForeman')
      .populate('foreman', 'name')
      .sort({ date: -1 })
      .lean();

    const workerMap = {};
    for (const p of prods) {
      if (!p.labour) continue;
      const id = p.labour._id.toString();

      if (!workerMap[id]) {
        workerMap[id] = {
          labourId: id,
          name: p.labour.name,
          labourType: p.labour.labourType || 'Simple',
          role: p.labour.role || 'Labour',
          foremanName: p.foreman?.name || 'Unassigned',
          totalNet: 0,
          totalTarget: 0,
          totalRejects: 0,
          totalBonus: 0,
          presentDays: 0,
          daysBelowTarget: 0,
          history: [],
          reasons: []
        };
      }

      const net = (Number(p.netProduction) || 0) + (Number(p.secondaryTotalProduction) || 0);
      const target = (Number(p.targetProduction) || 0) + (Number(p.secondaryTargetProduction) || 0);
      const rej = (Number(p.totalReject) || 0) + (Number(p.secondaryTotalReject) || 0);
      const bonus = (Number(p.bonusAmount) || 0) + (Number(p.secondaryBonusAmount) || 0);

      workerMap[id].totalNet += net;
      workerMap[id].totalTarget += target;
      workerMap[id].totalRejects += rej;
      workerMap[id].totalBonus += bonus;
      workerMap[id].presentDays++;

      const isBelow = target > 0 && net < target;
      if (isBelow) {
        workerMap[id].daysBelowTarget++;
        if (p.lowProductionReason && p.lowProductionReason.trim()) {
          workerMap[id].reasons.push(p.lowProductionReason.trim());
        }
      }

      workerMap[id].history.push({
        date: p.date,
        net,
        target,
        rejects: rej,
        achieved: target > 0 ? (net >= target) : true,
        achievementRate: target > 0 ? Math.round((net / target) * 100) : 100,
        reason: p.lowProductionReason || ''
      });
    }

    const allWorkers = Object.values(workerMap).map(w => {
      const achievementRate = w.totalTarget > 0 ? Number(((w.totalNet / w.totalTarget) * 100).toFixed(1)) : 100;
      const defectRate = (w.totalNet + w.totalRejects) > 0 ? Number(((w.totalRejects / (w.totalNet + w.totalRejects)) * 100).toFixed(2)) : 0;
      const avgPerDay = w.presentDays > 0 ? Math.round(w.totalNet / w.presentDays) : 0;
      const shortfall = Math.max(0, w.totalTarget - w.totalNet);

      // Top reasons frequency
      const reasonCounts = {};
      w.reasons.forEach(r => {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      });
      const topReasons = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([r, count]) => `${r} (${count}x)`);

      return {
        ...w,
        achievementRate,
        defectRate,
        avgPerDay,
        shortfall,
        topReasons
      };
    });

    // 1A. Top Performers (Who makes the highest)
    const topPerformers = [...allWorkers]
      .sort((a, b) => b.totalNet - a.totalNet)
      .slice(0, 20)
      .map((w, index) => ({
        ...w,
        rank: index + 1,
        badge: index === 0 ? 'Champion Producer' : (w.achievementRate >= 115 ? 'High Efficiency' : 'Consistent Producer')
      }));

    // 1B. Target Deficits (Who is not achieving targets)
    const targetDeficits = [...allWorkers]
      .filter(w => w.totalTarget > 0 && w.shortfall > 0)
      .sort((a, b) => b.shortfall - a.shortfall)
      .slice(0, 20)
      .map((w, index) => ({
        ...w,
        deficitRank: index + 1,
        missedRate: Number(((w.daysBelowTarget / (w.presentDays || 1)) * 100).toFixed(0))
      }));

    // 1C. Continuous Downperformers (Streak of consecutive missed target days)
    const streakThreshold = Number(minStreak) || 2;
    const continuousDownperformers = [];

    for (const w of allWorkers) {
      let streak = 0;
      const missedShifts = [];

      for (const h of w.history) {
        if (h.target > 0 && !h.achieved) {
          streak++;
          missedShifts.push(h);
        } else if (h.target > 0 && h.achieved) {
          break; // streak is broken by an achieved target
        }
      }

      if (streak >= streakThreshold) {
        // Trend calculation
        let trend = 'stagnant';
        if (missedShifts.length >= 2) {
          const latestRate = missedShifts[0].achievementRate;
          const prevRate = missedShifts[1].achievementRate;
          if (latestRate < prevRate - 5) trend = 'dropping';
          else if (latestRate > prevRate + 5) trend = 'recovering';
        }

        continuousDownperformers.push({
          labourId: w.labourId,
          name: w.name,
          labourType: w.labourType,
          foremanName: w.foremanName,
          role: w.role,
          streak,
          severity: streak >= 4 ? 'critical' : 'warning',
          trend,
          missedShifts: missedShifts.slice(0, 5),
          latestReason: missedShifts[0]?.reason || 'No reason logged',
          recommendation: streak >= 4 ? 'Urgent floor inspection & machine check' : 'Foreman check-in recommended'
        });
      }
    }
    continuousDownperformers.sort((a, b) => b.streak - a.streak);

    // ─────────────────────────────────────────────────────────────
    // 2. REGULAR & REPEAT CLIENTS
    // ─────────────────────────────────────────────────────────────
    const outgoing = await OutgoingArticle.find().lean();
    const dispatches = await Dispatch.find().lean();

    const clientMap = {};

    // Invoices from OutgoingArticle
    for (const out of outgoing) {
      const name = (out.buyerDetails?.name || '').trim();
      if (!name) continue;

      if (!clientMap[name]) {
        clientMap[name] = {
          clientName: name,
          city: out.buyerDetails?.city || '',
          state: out.buyerDetails?.state || '',
          gstin: out.buyerDetails?.gstin || '',
          invoiceCount: 0,
          dispatchCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          dates: [],
          products: new Set()
        };
      }
      clientMap[name].invoiceCount++;
      clientMap[name].totalRevenue += Number(out.grandTotal) || 0;
      if (out.invoiceDetails?.invoiceDate) {
        clientMap[name].dates.push(new Date(out.invoiceDetails.invoiceDate));
      }
      (out.goodsDetails || []).forEach(g => {
        clientMap[name].totalQuantity += Number(g.qty) || 0;
        if (g.description) clientMap[name].products.add(g.description);
      });
    }

    // Party names from Dispatch
    for (const disp of dispatches) {
      const name = (disp.partyName || '').trim();
      if (!name) continue;

      if (!clientMap[name]) {
        clientMap[name] = {
          clientName: name,
          city: '',
          state: '',
          gstin: '',
          invoiceCount: 0,
          dispatchCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          dates: [],
          products: new Set()
        };
      }
      clientMap[name].dispatchCount++;
      clientMap[name].totalQuantity += Number(disp.totalProduced) || 0;
      if (disp.date) clientMap[name].dates.push(new Date(disp.date));
      if (disp.productName) clientMap[name].products.add(disp.productName);
    }

    const regularClients = Object.values(clientMap).map(c => {
      c.dates.sort((a, b) => b - a);
      const totalOrders = c.invoiceCount + c.dispatchCount;
      const lastOrderDate = c.dates[0] || null;
      const firstOrderDate = c.dates[c.dates.length - 1] || null;
      const daysSinceLastOrder = lastOrderDate ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24)) : 999;

      let frequencyStatus = 'Occasional Buyer';
      let statusColor = 'yellow';

      if (daysSinceLastOrder <= 14 && totalOrders >= 2) {
        frequencyStatus = 'Active Regular (Weekly)';
        statusColor = 'emerald';
      } else if (daysSinceLastOrder <= 45 || totalOrders >= 2) {
        frequencyStatus = 'Regular Monthly';
        statusColor = 'blue';
      }

      return {
        clientName: c.clientName,
        city: c.city,
        state: c.state,
        gstin: c.gstin,
        totalOrders,
        invoiceCount: c.invoiceCount,
        dispatchCount: c.dispatchCount,
        totalQuantity: c.totalQuantity,
        totalRevenue: Math.round(c.totalRevenue),
        lastOrderDate,
        firstOrderDate,
        daysSinceLastOrder,
        frequencyStatus,
        statusColor,
        products: Array.from(c.products).slice(0, 5)
      };
    });

    regularClients.sort((a, b) => b.totalOrders - a.totalOrders || b.totalRevenue - a.totalRevenue);

    // ─────────────────────────────────────────────────────────────
    // 3. RAW MATERIAL VENDOR PRICE CREEP / OVERCHARGING DETECTION
    // ─────────────────────────────────────────────────────────────
    const incoming = await IncomingArticle.find()
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const vendorMap = {};
    for (const item of incoming) {
      const vendorName = (item.purchasedFrom || 'Unknown Vendor').trim();
      const particular = (item.particulars || 'Item').trim();
      const key = `${vendorName} __ ${particular.toLowerCase()}`;

      if (!vendorMap[key]) {
        vendorMap[key] = {
          vendor: vendorName,
          particulars: particular,
          bills: []
        };
      }
      vendorMap[key].bills.push(item);
    }

    const vendorPriceHikes = [];
    let totalExtraCostBleed = 0;

    for (const group of Object.values(vendorMap)) {
      if (group.bills.length < 2) continue;

      // Check chronologically for price increases
      for (let i = 1; i < group.bills.length; i++) {
        const prev = group.bills[i - 1];
        const curr = group.bills[i];

        const prevCost = Number(prev.unitCost) || 0;
        const currCost = Number(curr.unitCost) || 0;

        if (currCost > prevCost) {
          const priceDiff = Number((currCost - prevCost).toFixed(2));
          const percentIncrease = prevCost > 0 ? Number(((priceDiff / prevCost) * 100).toFixed(1)) : 0;
          const weight = Number(curr.weight) || 0;
          const extraCostBleed = Number((priceDiff * weight).toFixed(2));

          totalExtraCostBleed += extraCostBleed;

          // Flag if this hike occurred in the latest purchase
          const isLatestBill = (i === group.bills.length - 1);

          vendorPriceHikes.push({
            vendor: group.vendor,
            particulars: group.particulars,
            previousUnitCost: prevCost,
            previousDate: prev.date,
            previousBillNo: prev.billNo,
            currentUnitCost: currCost,
            currentDate: curr.date,
            currentBillNo: curr.billNo,
            priceDiff,
            percentIncrease,
            currentWeight: weight,
            extraCostBleed,
            isLatestBill,
            history: group.bills.map(b => ({
              date: b.date,
              billNo: b.billNo,
              unitCost: b.unitCost,
              weight: b.weight,
              totalCost: b.totalCost
            }))
          });
        }
      }
    }

    // Sort by latest bill first, then highest extra cost bleed
    vendorPriceHikes.sort((a, b) => {
      if (a.isLatestBill && !b.isLatestBill) return -1;
      if (!a.isLatestBill && b.isLatestBill) return 1;
      return b.extraCostBleed - a.extraCostBleed;
    });

    // ─────────────────────────────────────────────────────────────
    // 4. EXECUTIVE SUMMARY METRICS
    // ─────────────────────────────────────────────────────────────
    const activeWorkersCount = allWorkers.length;
    const totalProductionVolume = allWorkers.reduce((sum, w) => sum + w.totalNet, 0);
    const totalTargetVolume = allWorkers.reduce((sum, w) => sum + w.totalTarget, 0);
    const overallAchievement = totalTargetVolume > 0 ? Number(((totalProductionVolume / totalTargetVolume) * 100).toFixed(1)) : 100;

    res.json({
      summary: {
        activeWorkersCount,
        totalProductionVolume,
        overallAchievement,
        topPerformer: topPerformers[0] || null,
        targetDeficitsCount: targetDeficits.length,
        continuousDownperformersCount: continuousDownperformers.length,
        regularClientsCount: regularClients.length,
        vendorPriceHikesCount: vendorPriceHikes.length,
        totalExtraCostBleed: Math.round(totalExtraCostBleed)
      },
      topPerformers,
      targetDeficits,
      continuousDownperformers,
      regularClients,
      vendorPriceHikes
    });

  } catch (error) {
    console.error('Error in getExecutiveInsights:', error);
    res.status(500).json({ message: 'Server error generating insights', error: error.message });
  }
};
