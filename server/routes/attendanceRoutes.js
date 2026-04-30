const express = require('express');
const { getAttendance } = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorizeRoles('superadmin'), getAttendance);

module.exports = router;
