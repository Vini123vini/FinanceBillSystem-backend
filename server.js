const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── MongoDB Cached Connection ───────────────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  isConnected = true;
  console.log('✅  MongoDB connected');
};

// ─── Connect DB before every request ────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌  MongoDB error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
      uri_set: !!process.env.MONGODB_URI
    });
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date(),
    mongodb: isConnected ? 'connected' : 'disconnected',
    uri_set: !!process.env.MONGODB_URI
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/invoices',  require('./routes/invoices'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/reports',   require('./routes/reports'));

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// ─── Local Dev Only ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kanakku')
    .then(() => app.listen(PORT, () => console.log(`🚀  API running → http://localhost:${PORT}`)))
    .catch(err => console.error('❌  MongoDB error:', err.message));
}

module.exports = app;
