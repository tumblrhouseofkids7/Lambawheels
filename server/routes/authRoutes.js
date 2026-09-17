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
    const token = generateToken(res, req.user._id, req.user.role);
    
    // Redirect based on role
    // Assuming frontend URLs are something like this
    const role = req.user.role;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Helper function to append token to URL
    const appendToken = (url) => {
      const separator = url.includes('?') ? '&' : '?';
      return `${url.replace(/\/$/, '')}${separator}token=${token}`;
    };
    
    if (role === 'superadmin') {
      res.redirect(isProduction ? appendToken(process.env.FRONTEND_URL_SUPERADMIN || 'https://superadmin-erp.vercel.app') : appendToken('http://localhost:5175'));
    } else if (role === 'accountant') {
      res.redirect(isProduction ? appendToken(process.env.FRONTEND_URL_ACCOUNTANT || 'https://accountant-erp.vercel.app') : appendToken('http://localhost:5173'));
    } else if (role === 'foreman') {
      res.redirect(isProduction ? appendToken(process.env.FRONTEND_URL_FOREMAN || 'https://foremen-erp.vercel.app') : appendToken('http://localhost:5174'));
    } else {
      res.redirect(isProduction ? appendToken(process.env.FRONTEND_URL_FOREMAN ? `${process.env.FRONTEND_URL_FOREMAN}/pending` : 'https://foremen-erp.vercel.app/pending') : appendToken('http://localhost:5174/pending'));
    }
  }
);

module.exports = router;
