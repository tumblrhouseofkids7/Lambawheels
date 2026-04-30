const mongoose = require('mongoose');
require('dotenv').config();
const Production = require('./models/Production');
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  try {
    const prod = new Production({
      labour: new mongoose.Types.ObjectId(),
      foreman: new mongoose.Types.ObjectId(),
      date: new Date(),
      shiftType: 'Day',
      attendance: 'Present',
      inTime: '',
      outTime: '',
      targetProduction: '',
      totalProduction: 100,
      totalReject: '',
      reject2: '',
      reject3: '',
      bonusRate: 0.05,
      overtimePay: '',
      advances: 0,
      deductions: 0
    });
    await prod.save();
    console.log('Saved successfully!');
  } catch (err) {
    console.log('Validation Error during save:', err.stack);
  }
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
