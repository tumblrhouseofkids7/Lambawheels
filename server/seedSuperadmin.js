require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedSuperadmin = async () => {
  try {
    await connectDB();
    
    const superadminEmail = 'lambawheels10@gmail.com';
    
    const existingUser = await User.findOne({ email: superadminEmail });
    if (existingUser) {
      console.log('Superadmin already exists. Ensuring role is superadmin...');
      existingUser.role = 'superadmin';
      await existingUser.save();
      console.log('Done.');
      process.exit();
    }

    const superadmin = new User({
      name: 'Super Admin',
      email: superadminEmail,
      password: 'password123', // Please change this after logging in
      role: 'superadmin'
    });

    await superadmin.save();
    console.log('Superadmin created successfully! Email: lambawheels10@gmail.com, Password: password123');
    process.exit();
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperadmin();
