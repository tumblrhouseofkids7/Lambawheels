const express = require('express');
const { startShift, getActiveShift, endShift, getShiftHistory, getShiftsForDate } = require('../controllers/shiftController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// foreman, accountant, superadmin can all manage their own shifts
router.route('/')
  .post(protect, authorizeRoles('foreman', 'accountant', 'superadmin'), startShift);

router.route('/active')
  .get(protect, authorizeRoles('foreman', 'accountant', 'superadmin'), getActiveShift);

router.route('/history')
  .get(protect, authorizeRoles('foreman', 'accountant', 'superadmin'), getShiftHistory);

// Accountant/superadmin: see all foremen shifts for a given date
router.route('/fordate')
  .get(protect, authorizeRoles('accountant', 'superadmin'), getShiftsForDate);

router.route('/:id/end')
  .put(protect, authorizeRoles('foreman', 'accountant', 'superadmin'), endShift);

module.exports = router;
