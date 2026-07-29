const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' ? 'https://lambawheels-backend-orcin.vercel.app/api/auth/google/callback' : (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'),
  },
    async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email: email });

      if (user) {
        let modified = false;
        if (!user.googleId) {
          user.googleId = profile.id;
          modified = true;
        }
        if (!user.profilePic && profile.photos && profile.photos[0]) {
          user.profilePic = profile.photos[0].value;
          modified = true;
        }
        
        if (email === 'lambawheels10@gmail.com' && user.role !== 'superadmin') {
          user.role = 'superadmin';
          modified = true;
        }

        if (modified) {
          await user.save();
        }

        return done(null, user);
      } else {
        let assignedRole = 'pending';
        if (email === 'lambawheels10@gmail.com') {
          assignedRole = 'superadmin';
        }

        const newUser = new User({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          profilePic: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          role: assignedRole,
        });

        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      return done(error, null);
    }
  }
));
} else {
  console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth will not work.");
}

module.exports = passport;
