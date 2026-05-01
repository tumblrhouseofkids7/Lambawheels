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
      res.redirect(process.env.FRONTEND_URL_SUPERADMIN || 'https://superadmin-erp.vercel.app/');
    } else if (role === 'accountant') {
      res.redirect(process.env.FRONTEND_URL_ACCOUNTANT || 'https://accountant-erp.vercel.app/');
    } else if (role === 'foreman') {
      res.redirect(process.env.FRONTEND_URL_FOREMAN || 'https://foremen-erp.vercel.app/');
    } else {
      res.redirect(process.env.FRONTEND_URL_FOREMAN ? `${process.env.FRONTEND_URL_FOREMAN}/pending` : 'https://foremen-erp.vercel.app/pending');
    }
  }
);

module.exports = router;
