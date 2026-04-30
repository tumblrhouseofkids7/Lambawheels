const express = require('express');
const router = express.Router();
const { generateSalary, updateSalary, getSalarySheet, getContractorSalary, updateContractorRate } = require('../controllers/salaryController');
// const { protect, authorize } = require('../middleware/auth'); 
// Assuming auth is handled elsewhere or not strictly required for this specific test case based on other routes

router.get('/', getSalarySheet);
router.post('/generate', generateSalary);
router.put('/update/:id', updateSalary);

// Contractor (Thakadar) Salary Routes
router.get('/contractor', getContractorSalary);
router.put('/contractor/:id/rate', updateContractorRate);

module.exports = router;
