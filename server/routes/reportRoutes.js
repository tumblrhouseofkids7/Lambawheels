const express = require('express');
const { getDashboardSummary, getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', protect, getDashboardSummary);
router.get('/', protect, getReports);

module.exports = router;
