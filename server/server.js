require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/db');

// Connect to database
connectDB().catch(err => console.error("Initial DB Connection Failed:", err.message));

// Passport config
require('./config/passport');

const app = express();

// Middleware
const defaultFrontendUrls = [
  'https://superadmin-erp.vercel.app',
  'https://accountant-erp.vercel.app',
  'https://foremen-erp.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

let frontendUrls = [...defaultFrontendUrls];
if (process.env.FRONTEND_URLS) {
  const envUrls = process.env.FRONTEND_URLS.split(',').map(url => url.trim().replace(/\/$/, ''));
  frontendUrls = [...new Set([...frontendUrls, ...envUrls])];
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (frontendUrls.includes(cleanOrigin) || frontendUrls.includes('*')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      console.log('Allowed URLs:', frontendUrls);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
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

// Health check route for debugging env vars
app.get('/api/health', (req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGO_URI,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleCallbackUrl: !!process.env.GOOGLE_CALLBACK_URL,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// DB Test route
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.createConnection(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    }).asPromise();
    res.json({ success: true, message: "Connected successfully!" });
    conn.close();
  } catch (error) {
    res.json({ success: false, error: error.message, stack: error.stack });
  }
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
