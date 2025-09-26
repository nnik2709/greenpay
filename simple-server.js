const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

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

// Mock data for testing
const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: ChangeMe123!
    role: { name: 'Admin' },
    isActive: true
  },
  {
    id: 2,
    name: 'Agent User',
    email: 'agent@example.com',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: ChangeMe123!
    role: { name: 'Agent' },
    isActive: true
  },
  {
    id: 3,
    name: 'Revenue Manager',
    email: 'revenue@example.com',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: ChangeMe123!
    role: { name: 'Revenue Manager' },
    isActive: true
  },
  {
    id: 4,
    name: 'Auditor User',
    email: 'auditor@example.com',
    passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: ChangeMe123!
    role: { name: 'Auditor' },
    isActive: true
  }
];

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = mockUsers.find(u => u.email === email);

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
      totalPassports: 5,
      totalVouchers: 30,
      totalPayments: 4,
      totalQuotations: 6,
      totalTickets: 5,
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
    const passports = [
      {
        id: 1,
        passportNo: 'P123456789',
        surname: 'Doe',
        givenName: 'John',
        nationality: 'Papua New Guinea',
        createdAt: new Date().toISOString(),
        createdBy: { name: 'Admin User', email: 'admin@example.com' },
        vouchers: []
      },
      {
        id: 2,
        passportNo: 'P987654321',
        surname: 'Smith',
        givenName: 'Jane',
        nationality: 'Papua New Guinea',
        createdAt: new Date().toISOString(),
        createdBy: { name: 'Agent User', email: 'agent@example.com' },
        vouchers: []
      }
    ];
    res.json(passports);
  } catch (error) {
    console.error('Passports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Vouchers endpoints
app.get('/vouchers', async (req, res) => {
  try {
    const vouchers = [
      {
        id: 1,
        code: 'VOUCHER001',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        value: 50.00,
        status: 'active',
        passport: { passportNo: 'P123456789', surname: 'Doe', givenName: 'John', nationality: 'Papua New Guinea' },
        payment: { code: 'PAY001', totalAmount: 50.00, paymentMode: 'cash' },
        createdBy: { name: 'Admin User', email: 'admin@example.com' }
      }
    ];
    res.json(vouchers);
  } catch (error) {
    console.error('Vouchers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payments endpoints
app.get('/payments', async (req, res) => {
  try {
    const payments = [
      {
        id: 1,
        code: 'PAY001',
        totalAmount: 50.00,
        paymentMode: 'cash',
        passport: { passportNo: 'P123456789', surname: 'Doe', givenName: 'John', nationality: 'Papua New Guinea' },
        vouchers: [{ id: 1, code: 'VOUCHER001', status: 'active' }],
        createdBy: { name: 'Admin User', email: 'admin@example.com' }
      }
    ];
    res.json(payments);
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Quotations endpoints
app.get('/quotations', async (req, res) => {
  try {
    const quotations = [
      {
        id: 1,
        subject: 'Carbon Offset Certificate',
        description: 'Individual carbon offset certificate',
        amount: 50.00,
        status: 'pending',
        invoice: { id: 1, amount: 50.00, status: 'pending' }
      }
    ];
    res.json(quotations);
  } catch (error) {
    console.error('Quotations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Tickets endpoints
app.get('/tickets', async (req, res) => {
  try {
    const tickets = [
      {
        id: 1,
        subject: 'Login Issue',
        category: 'Technical',
        priority: 'Medium',
        status: 'Open',
        description: 'User unable to login',
        user: { name: 'John Doe', email: 'john@example.com' },
        responses: [],
        createdAt: new Date().toISOString()
      }
    ];
    res.json(tickets);
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PNG Green Fees API running on port ${PORT}`);
  console.log(`📊 Mock data loaded - ready for testing`);
});
