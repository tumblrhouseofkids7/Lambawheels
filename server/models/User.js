const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    // Nullable for Google Auth users
  },
  role: {
    type: String,
    enum: ['superadmin', 'accountant', 'foreman', 'pending', 'blocked'],
    default: 'pending'
  },
  phone: {
    type: String
  },
  googleId: {
    type: String
  },
  profilePic: {
    type: String
  },
  dispatchRate: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// In Mongoose 7+, async pre-hooks do NOT use next() — just return or throw.
userSchema.pre('save', async function () {
  // Skip hashing if password wasn't set or modified (e.g. Google OAuth users)
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
