const Dispatch = require('../models/Dispatch');
const Labour = require('../models/Labour');

// ─── GET /api/dispatch?date=&shift=&foremanId= ──────────────────────────────
const getDispatches = async (req, res) => {
  try {
    const { date, startDate, endDate, shift, foremanId } = req.query;
    const query = {};
    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }
    if (shift) query.shift = shift;

    // All foremen see all dispatches
    if (foremanId) {
      query.foremanId = foremanId;
    }

    const dispatches = await Dispatch.find(query)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .populate('createdBy', 'name')
      .populate('foremanId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const result = dispatches.map(d => ({
      ...d,
      entries: d.entries || [],
      totalProduced: (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    }));

    res.json(result);
  } catch (error) {
    console.error('[getDispatches ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/dispatch ─────────────────────────────────────────────────────
// Accountant creates a new dispatch sheet row for a specific foreman.
const createDispatch = async (req, res) => {
  try {
    const { productName, targetQty, date, shift, foremanId, foremanName, partyName } = req.body;

    if (!productName || !String(productName).trim())
      return res.status(400).json({ message: 'productName is required' });
    if (!date)
      return res.status(400).json({ message: 'date is required (YYYY-MM-DD)' });
    if (!shift || !['Day', 'Night'].includes(shift))
      return res.status(400).json({ message: 'shift must be Day or Night' });

    const pName = String(productName).trim();
    const pParty = partyName ? String(partyName).trim() : '';

    // Prevent duplicate product for same date+shift+foreman+party
    // Different parties CAN have the same product for the same foreman
    const dupQuery = { productName: pName, date: String(date), shift, partyName: pParty };
    if (foremanId) dupQuery.foremanId = foremanId;
    const existing = await Dispatch.findOne(dupQuery).lean();
    if (existing)
      return res.status(409).json({ message: `'${pName}' already exists for this foreman${pParty ? ` and party '${pParty}'` : ''} on ${date} ${shift} shift` });

    const dispatch = new Dispatch({
      productName: pName,
      targetQty: Number(targetQty) || 0,
      date: String(date),
      shift,
      foremanId: foremanId || null,
      foremanName: foremanName || '',
      partyName: pParty,
      entries: [],
      totalProduced: 0,
      createdBy: req.user._id,
    });

    const saved = await dispatch.save();
    const populated = await Dispatch.findById(saved._id)
      .populate('createdBy', 'name')
      .populate('foremanId', 'name email')
      .lean();
    res.status(201).json({ ...populated, entries: [], totalProduced: 0 });
  } catch (error) {
    console.error('[createDispatch ERROR]', error.message, error);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/dispatch/add-entry ───────────────────────────────────────────
const addEntry = async (req, res) => {
  try {
    const { dispatchId, labourId, quantity } = req.body;

    if (!dispatchId)
      return res.status(400).json({ message: 'dispatchId is required' });
    if (quantity === undefined || quantity === null || quantity === '')
      return res.status(400).json({ message: 'quantity is required' });
    if (Number(quantity) < 0)
      return res.status(400).json({ message: 'quantity cannot be negative' });

    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch)
      return res.status(404).json({ message: 'Dispatch sheet not found' });


    let labourName = req.body.labourName || '';
    if (labourId) {
      const labour = await Labour.findById(labourId).lean();
      if (labour) labourName = labour.name;
    }

    dispatch.entries.push({
      labourId: labourId || undefined,
      labourName,
      gender: req.body.gender || '',
      quantity: Number(quantity),
      foremanId: req.user._id,
      foremanName: req.user.name || '',
      addedAt: new Date(),
    });
    dispatch.totalProduced = dispatch.entries.reduce((s, e) => s + (Number(e.quantity) || 0), 0);

    const saved = await dispatch.save();
    const populated = await Dispatch.findById(saved._id)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .lean();

    res.status(201).json({
      ...populated,
      entries: populated.entries || [],
      totalProduced: (populated.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    });
  } catch (error) {
    console.error('[addEntry ERROR]', error.message, error);
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/dispatch/:id/entries/:entryId ──────────────────────────────
const deleteEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const dispatch = await Dispatch.findById(id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    dispatch.entries = dispatch.entries.filter(e => e._id.toString() !== entryId);
    dispatch.totalProduced = dispatch.entries.reduce((s, e) => s + (Number(e.quantity) || 0), 0);
    const saved = await dispatch.save();

    const populated = await Dispatch.findById(saved._id)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .lean();

    res.json({
      ...populated,
      entries: populated.entries || [],
      totalProduced: (populated.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    });
  } catch (error) {
    console.error('[deleteEntry ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/dispatch/:id ───────────────────────────────────────────────────
const updateDispatch = async (req, res) => {
  try {
    const { productName, targetQty } = req.body;
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    if (productName !== undefined) dispatch.productName = String(productName).trim();
    if (targetQty !== undefined) dispatch.targetQty = Number(targetQty);

    const saved = await dispatch.save();
    const populated = await Dispatch.findById(saved._id)
      .populate('createdBy', 'name')
      .populate('foremanId', 'name email')
      .lean();
    res.json({ ...populated, entries: populated.entries || [] });
  } catch (error) {
    console.error('[updateDispatch ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/dispatch/:id ────────────────────────────────────────────────
const deleteDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    await dispatch.deleteOne();
    res.json({ message: 'Dispatch deleted' });
  } catch (error) {
    console.error('[deleteDispatch ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/dispatch/export/pdf?date=&shift=&foremanId= ───────────────────
const exportPDF = async (req, res) => {
  try {
    const { date, shift, foremanId, partyName } = req.query;
    const query = {};
    if (date) query.date = date;
    if (shift) query.shift = shift;
    if (foremanId) query.foremanId = foremanId;
    if (partyName) query.partyName = partyName;

    const dispatches = await Dispatch.find(query)
      .populate('entries.labourId', 'name')
      .populate('foremanId', 'name')
      .sort({ productName: 1 })
      .lean();

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    const fName = dispatches[0]?.foremanName || dispatches[0]?.foremanId?.name || '';
    const filename = `Dispatch_${date || 'All'}${partyName ? `_${partyName}` : ''}${fName ? `_${fName}` : ''}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(16).font('Helvetica-Bold').text('LAMBA WHEELS ERP', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Dispatch Sheet  |  Date: ${date || 'All'}  |  Shift: ${shift || 'All'}${partyName ? `  |  Company: ${partyName}` : ''}${fName ? `  |  Foreman: ${fName}` : ''}  |  Generated: ${new Date().toLocaleString('en-IN')}`,
      { align: 'center' }
    );
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
    doc.moveDown(0.5);

    if (dispatches.length === 0) {
      doc.text('No dispatch data found for the selected filters.', { align: 'center' });
      doc.end();
      return;
    }

    const labourSet = new Set();
    dispatches.forEach(d => {
      (d.entries || []).forEach(e => {
        labourSet.add(e.labourName || e.labourId?.name || 'Unknown');
      });
    });
    const labourNames = Array.from(labourSet).sort();

    const colW = Math.min(90, Math.floor((doc.page.width - 60 - 130) / Math.max(dispatches.length, 1)));
    const nameColW = 130;
    const rowH = 22;
    const startX = 30;
    let y = doc.y;

    const drawCell = (x, y, w, h, text, opts = {}) => {
      doc.rect(x, y, w, h).stroke();
      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(opts.size || 8)
         .fillColor(opts.color || '#000000')
         .text(String(text), x + 3, y + (h - (opts.size || 8)) / 2, { width: w - 6, align: opts.align || 'left', ellipsis: true });
    };

    drawCell(startX, y, nameColW, rowH, 'LABOUR / PRODUCT', { bold: true });
    let x = startX + nameColW;
    dispatches.forEach(d => {
      drawCell(x, y, colW, rowH, `${d.productName} (T:${d.targetQty})`, { bold: true, align: 'center', size: 7 });
      x += colW;
    });
    drawCell(x, y, colW, rowH, 'TOTAL', { bold: true, align: 'center' });
    y += rowH;

    labourNames.forEach(lName => {
      let rowTotal = 0;
      drawCell(startX, y, nameColW, rowH, lName, {});
      x = startX + nameColW;
      dispatches.forEach(d => {
        const entryQty = (d.entries || [])
          .filter(e => (e.labourName || e.labourId?.name || 'Unknown') === lName)
          .reduce((s, e) => s + (Number(e.quantity) || 0), 0);
        rowTotal += entryQty;
        drawCell(x, y, colW, rowH, entryQty ? entryQty.toString() : '', { align: 'center' });
        x += colW;
      });
      drawCell(x, y, colW, rowH, rowTotal ? rowTotal.toString() : '', { bold: true, align: 'center' });
      y += rowH;
      if (y > doc.page.height - 60) { doc.addPage({ layout: 'landscape' }); y = 30; }
    });

    drawCell(startX, y, nameColW, rowH, 'TOTAL PRODUCED', { bold: true });
    x = startX + nameColW;
    let grandTotal = 0;
    dispatches.forEach(d => {
      const tp = (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0);
      drawCell(x, y, colW, rowH, tp.toString(), { bold: true, align: 'center', color: '#10b981' });
      grandTotal += tp;
      x += colW;
    });
    drawCell(x, y, colW, rowH, grandTotal.toString(), { bold: true, align: 'center', color: '#10b981' });
    y += rowH;

    drawCell(startX, y, nameColW, rowH, 'TARGET', { bold: true });
    x = startX + nameColW;
    let totalTarget = 0;
    dispatches.forEach(d => {
      drawCell(x, y, colW, rowH, (d.targetQty || 0).toString(), { align: 'center', color: '#d97706' });
      totalTarget += (d.targetQty || 0);
      x += colW;
    });
    drawCell(x, y, colW, rowH, totalTarget.toString(), { bold: true, align: 'center', color: '#d97706' });

    doc.end();
  } catch (error) {
    console.error('[exportPDF ERROR]', error.message, error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/dispatch/:id/workers/rename ──────────────────────────────────
const renameWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Both oldName and newName are required' });
    }

    const dispatch = await Dispatch.findById(id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    let updated = false;
    dispatch.entries.forEach(e => {
      if (e.labourName === oldName) {
        e.labourName = newName;
        updated = true;
      }
    });

    if (updated) {
      await dispatch.save();
    }

    const populated = await Dispatch.findById(dispatch._id)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .lean();

    res.json({
      ...populated,
      entries: populated.entries || [],
      totalProduced: (populated.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    });
  } catch (error) {
    console.error('[renameWorker ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/dispatch/:id/workers/:workerName ─────────────────────────
const deleteWorker = async (req, res) => {
  try {
    const { id, workerName } = req.params;

    const dispatch = await Dispatch.findById(id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    const initialLength = dispatch.entries.length;
    dispatch.entries = dispatch.entries.filter(e => e.labourName !== workerName);

    if (dispatch.entries.length !== initialLength) {
      dispatch.totalProduced = dispatch.entries.reduce((s, e) => s + (Number(e.quantity) || 0), 0);
      await dispatch.save();
    }

    const populated = await Dispatch.findById(dispatch._id)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .lean();

    res.json({
      ...populated,
      entries: populated.entries || [],
      totalProduced: (populated.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    });
  } catch (error) {
    console.error('[deleteWorker ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/dispatch/submit-shift ──────────────────────────────────────────
const submitShift = async (req, res) => {
  try {
    const { date, shift } = req.body;
    if (!date || !shift) return res.status(400).json({ message: 'Date and shift required' });

    const query = { date, shift };
    // Foreman sees all dispatches for this date/shift, so submission marks all as submitted

    await Dispatch.updateMany(query, { isSubmitted: true });

    // Fetch the updated dispatches
    const dispatches = await Dispatch.find(query)
      .populate('entries.labourId', 'name')
      .populate('entries.foremanId', 'name')
      .populate('createdBy', 'name')
      .populate('foremanId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const result = dispatches.map(d => ({
      ...d,
      entries: d.entries || [],
      totalProduced: (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
    }));

    res.json(result);
  } catch (error) {
    console.error('[submitShift ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDispatches,
  createDispatch,
  addEntry,
  deleteEntry,
  updateDispatch,
  deleteDispatch,
  exportPDF,
  renameWorker,
  deleteWorker,
  submitShift,
};
