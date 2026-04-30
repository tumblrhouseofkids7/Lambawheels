const express = require('express');
const { getProductions, addProduction, updateProduction } = require('../controllers/productionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getProductions)
  .post(protect, authorizeRoles('superadmin', 'foreman'), addProduction);

router.route('/:id')
  .put(protect, authorizeRoles('superadmin', 'foreman'), updateProduction);

module.exports = router;
