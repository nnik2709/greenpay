const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://floralwhite-jackal-925542.hostingersite.com',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PNG Green Fees API - Railway',
    version: '1.0.0'
  });
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ 
      sub: user.id, 
      email: user.email, 
      role: user.role?.name 
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

    res.json({
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dashboard stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      totalPassports: await prisma.passport.count(),
      totalVouchers: await prisma.voucher.count(),
      totalPayments: await prisma.payment.count(),
      totalQuotations: await prisma.quotation.count(),
      totalTickets: await prisma.ticket.count(),
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Passports endpoints
app.get('/passports', async (req, res) => {
  try {
    const passports = await prisma.passport.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        vouchers: { select: { id: true, code: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(passports);
  } catch (error) {
    console.error('Passports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Vouchers endpoints
app.get('/vouchers', async (req, res) => {
  try {
    const vouchers = await prisma.voucher.findMany({
      include: {
        passport: { select: { passportNo: true, surname: true, givenName: true, nationality: true } },
        payment: { select: { code: true, totalAmount: true, paymentMode: true } },
        createdBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vouchers);
  } catch (error) {
    console.error('Vouchers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payments endpoints
app.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        passport: { select: { passportNo: true, surname: true, givenName: true, nationality: true } },
        vouchers: { select: { id: true, code: true, status: true } },
        createdBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Quotations endpoints
app.get('/quotations', async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        invoice: { select: { id: true, amount: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    console.error('Quotations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Tickets endpoints
app.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { name: true, email: true } },
        responses: { 
          include: { 
            responder: { select: { name: true, email: true } } 
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PNG Green Fees API running on port ${PORT}`);
});
