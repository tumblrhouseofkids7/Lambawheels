require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Passport config
require('./config/passport');

const app = express();

// Middleware
const frontendUrls = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
app.use(cors({
  origin: frontendUrls,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/labours', require('./routes/labourRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/dispatch', require('./routes/dispatchRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/advances', require('./routes/advanceRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Lamba Wheels ERP API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
