const express = require('express');
const router = express.Router();
const { getAdvances, addAdvance, updateAdvance, deleteAdvance } = require('../controllers/advanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAdvances)
  .post(addAdvance);

router.route('/:id')
  .put(updateAdvance)
  .delete(deleteAdvance);

module.exports = router;
