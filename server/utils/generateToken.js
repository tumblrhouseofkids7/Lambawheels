const jwt = require('jsonwebtoken');

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'lax', // 'lax' required for cross-site OAuth redirects (Google → localhost)
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

module.exports = generateToken;
