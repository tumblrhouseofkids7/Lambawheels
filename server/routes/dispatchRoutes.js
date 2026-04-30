const express = require('express');
const {
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
} = require('../controllers/dispatchController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Export PDF (must be before /:id routes) ──────────────────────────────────
router.get('/export/pdf', protect, exportPDF);

// ── Dispatch Sheet CRUD ────────────────────────────────────────────────────
router.route('/')
  .get(protect, getDispatches)
  .post(protect, authorizeRoles('accountant', 'superadmin'), createDispatch);

// ── Foreman: add entry to a dispatch ────────────────────────────────────────
router.post('/add-entry', protect, authorizeRoles('foreman', 'accountant', 'superadmin'), addEntry);

// ── Foreman: submit shift ───────────────────────────────────────────────────
router.put('/submit-shift', protect, authorizeRoles('foreman', 'accountant', 'superadmin'), submitShift);

// ── Entry deletion ───────────────────────────────────────────────────────────
router.delete('/:id/entries/:entryId', protect, authorizeRoles('foreman', 'accountant', 'superadmin'), deleteEntry);

// ── Foreman: rename / delete worker across a dispatch ───────────────────────
router.put('/:id/workers/rename', protect, authorizeRoles('foreman', 'accountant', 'superadmin'), renameWorker);
router.delete('/:id/workers/:workerName', protect, authorizeRoles('foreman', 'accountant', 'superadmin'), deleteWorker);

// ── Dispatch row update / delete ─────────────────────────────────────────────
router.route('/:id')
  .put(protect, authorizeRoles('accountant', 'superadmin'), updateDispatch)
  .delete(protect, authorizeRoles('accountant', 'superadmin'), deleteDispatch);

module.exports = router;
