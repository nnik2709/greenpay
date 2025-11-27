require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GreenPay API is running' });
});

// API Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const passportRoutes = require('./routes/passports');
const individualPurchasesRoutes = require('./routes/individual-purchases');
const invoiceRoutes = require('./routes/invoices');
const invoicesGstRoutes = require('./routes/invoices-gst');
const quotationRoutes = require('./routes/quotations');
const ticketRoutes = require('./routes/tickets');
const paymentModeRoutes = require('./routes/payment-modes');
const transactionRoutes = require('./routes/transactions');
const loginEventsRoutes = require('./routes/login-events');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/passports', passportRoutes);
app.use('/api/individual-purchases', individualPurchasesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoices-gst', invoicesGstRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payment-modes', paymentModeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/login-events', loginEventsRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   🚀 GreenPay API Server Running      ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                       ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV}          ║`);
  console.log(`║   Database: ${process.env.DB_NAME}            ║`);
  console.log('╚════════════════════════════════════════╝\n');
});
