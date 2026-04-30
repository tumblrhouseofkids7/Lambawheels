const express = require('express');
const { getLabours, createLabour, deleteLabour, updateLabour } = require('../controllers/labourController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getLabours)
  .post(protect, authorizeRoles('superadmin', 'foreman'), upload.single('image'), createLabour);

router.route('/:id')
  .put(protect, authorizeRoles('superadmin', 'foreman'), upload.single('image'), updateLabour)
  .delete(protect, authorizeRoles('superadmin', 'foreman'), deleteLabour);

module.exports = router;
