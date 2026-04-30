const express = require('express');
const passport = require('passport');
const { registerUser, loginUser, logoutUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const generateToken = require('../utils/generateToken');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    generateToken(res, req.user._id, req.user.role);
    
    // Redirect based on role
    // Assuming frontend URLs are something like this
    const role = req.user.role;
    if (role === 'superadmin') {
      res.redirect('http://localhost:5175/');
    } else if (role === 'accountant') {
      res.redirect('http://localhost:5173/');
    } else if (role === 'foreman') {
      res.redirect('http://localhost:5174/');
    } else {
      res.redirect('http://localhost:5174/pending');
    }
  }
);

module.exports = router;
