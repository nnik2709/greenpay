require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Trust proxy - required for rate limiting behind nginx/reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Stripe webhook needs raw body for signature verification
// Apply raw body parser BEFORE express.json() for webhook routes
app.use('/api/public-purchases/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
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
const invoiceRoutes = require('./routes/invoices-gst'); // PNG GST-compliant invoice system
const quotationRoutes = require('./routes/quotations');
const customerRoutes = require('./routes/customers'); // Customer management for PNG invoices
const ticketRoutes = require('./routes/tickets');
const voucherRoutes = require('./routes/vouchers');
const corporateVoucherRegistrationRoutes = require('./routes/corporate-voucher-registration');
const paymentModeRoutes = require('./routes/payment-modes');
const transactionRoutes = require('./routes/transactions');
const loginEventsRoutes = require('./routes/login-events');
const settingsRoutes = require('./routes/settings');
const publicPurchasesRoutes = require('./routes/public-purchases'); // Public voucher purchases (no auth)
const { router: buyOnlineRoutes } = require('./routes/buy-online'); // Buy Online with passport (no auth)
const cashReconciliationRoutes = require('./routes/cash-reconciliations'); // Cash reconciliation for agents
const paymentWebhookDokuRoutes = require('./routes/payment-webhook-doku'); // BSP DOKU payment webhooks
const voucherRetrievalRoutes = require('./routes/voucher-retrieval'); // Voucher retrieval for customers (no auth)
const ocrRoutes = require('./routes/ocr'); // Python OCR service integration for MRZ scanning
const emailTemplatesRoutes = require('./routes/email-templates'); // Email templates management

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/passports', passportRoutes);
app.use('/api/individual-purchases', individualPurchasesRoutes);
app.use('/api/invoices', invoiceRoutes); // PNG GST-compliant invoices
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes); // Customer management
app.use('/api/tickets', ticketRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/corporate-voucher-registration', corporateVoucherRegistrationRoutes); // Voucher passport registration (corporate, individual, bulk)
app.use('/api/payment-modes', paymentModeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/login-events', loginEventsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/email-templates', emailTemplatesRoutes); // Email templates
app.use('/api/public-purchases', publicPurchasesRoutes); // Public routes (no authentication)
app.use('/api/buy-online', buyOnlineRoutes); // Buy Online with passport (no authentication)
app.use('/api/cash-reconciliations', cashReconciliationRoutes); // Cash reconciliation
app.use('/api/payment/webhook/doku', paymentWebhookDokuRoutes); // BSP DOKU webhooks (no authentication)
app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes); // ALIAS for BSP testing (bypasses ISP filters)
app.use('/api/voucher-retrieval', voucherRetrievalRoutes); // Voucher retrieval (no authentication - email verification required)
app.use('/api/ocr', ocrRoutes); // Python OCR service (no authentication - public)

// Laravel-compatible passport scan endpoint (for passport_ocr_service.exe)
// Maps /passport-scan to /api/ocr/passport-scan for backwards compatibility
app.post('/passport-scan', (req, res, next) => {
  req.url = '/passport-scan';
  ocrRoutes(req, res, next);
});
app.get('/passport-scan/status', (req, res, next) => {
  req.url = '/passport-scan/status';
  ocrRoutes(req, res, next);
});

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
const HOST = process.env.HOST || '127.0.0.1'; // Listen on localhost only for security

app.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   🚀 GreenPay API Server Running      ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Host: ${HOST}                    ║`);
  console.log(`║   Port: ${PORT}                       ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV}          ║`);
  console.log(`║   Database: ${process.env.DB_NAME}            ║`);
  console.log('╚════════════════════════════════════════╝\n');
});
