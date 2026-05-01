const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser, updateUser, updateOwnProfile, uploadProfilePic, getForemen, getDashboardStats } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


// Profile routes (any logged-in user)
router.route('/profile')
  .put(protect, updateOwnProfile);

router.post('/profile/pic', protect, upload.single('profilePic'), uploadProfilePic);

// Accountant & Superadmin routes
router.route('/foremen')
  .get(protect, authorizeRoles('accountant', 'superadmin'), getForemen);

// Superadmin dashboard stats
router.get('/dashboard-stats', protect, authorizeRoles('superadmin'), getDashboardStats);

// Superadmin routes
router.route('/')
  .get(protect, authorizeRoles('superadmin'), getUsers)
  .post(protect, authorizeRoles('superadmin'), createUser);

router.route('/:id')
  .delete(protect, authorizeRoles('superadmin'), deleteUser)
  .put(protect, authorizeRoles('superadmin'), updateUser);

module.exports = router;
