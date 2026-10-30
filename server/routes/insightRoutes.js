const express = require('express');
const { getExecutiveInsights } = require('../controllers/insightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/insights/executive
router.get('/executive', protect, getExecutiveInsights);

module.exports = router;
