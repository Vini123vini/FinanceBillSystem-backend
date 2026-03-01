const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors({ 
  origin: ['https://finance-bill-system-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/invoices',  require('./routes/invoices'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/reports',   require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;
