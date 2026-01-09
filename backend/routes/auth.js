const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Helper function to record login event
async function recordLoginEvent(userId, email, status, req, failureReason = null) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await db.query(
      `INSERT INTO login_events (user_id, email, login_time, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
      [userId, email, ipAddress, userAgent, status, failureReason]
    );
  } catch (error) {
    // Don't fail the login if event recording fails
    console.error('Failed to record login event:', error);
  }
}

// Login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Get user with role information
      const result = await db.query(
        `SELECT u.id, u.name, u.email, u."passwordHash", u."roleId", u."isActive", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        // Record failed login attempt (user not found)
        await recordLoginEvent(null, email, 'failed', req, 'User not found');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.isActive) {
        // Record failed login attempt (account inactive)
        await recordLoginEvent(user.id, email, 'failed', req, 'Account inactive');
        return res.status(401).json({ error: 'Account is inactive' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Record failed login attempt (wrong password)
        await recordLoginEvent(user.id, email, 'failed', req, 'Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Record successful login
      await recordLoginEvent(user.id, email, 'success', req);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user data without password
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Register new user
router.post('/register',
  authLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('roleId').isInt().withMessage('Role ID is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, roleId } = req.body;

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM "User" WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.query(
        `INSERT INTO "User" (name, email, password, "roleId", "isActive", "createdAt")
         VALUES ($1, $2, $3, $4, true, NOW())
         RETURNING id, name, email, "roleId", "isActive"`,
        [name, email, hashedPassword, roleId]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Change password
router.post('/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get current user password
      const result = await db.query(
        'SELECT password FROM "User" WHERE id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.query(
        'UPDATE "User" SET password = $1 WHERE id = $2',
        [hashedPassword, req.userId]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Admin reset password
router.post('/reset-password/:userId',
  auth,
  [
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const result = await db.query(
        'UPDATE "User" SET password = $1 WHERE id = $2 RETURNING id',
        [hashedPassword, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Verify token (check if user is still authenticated)
router.get('/verify', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u."roleId", u."isActive", r.name as role
       FROM "User" u
       JOIN "Role" r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get current user (alias for /verify, used by frontend)
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u."roleId", u."isActive", r.name as role
       FROM "User" u
       JOIN "Role" r ON u."roleId" = r.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});

module.exports = router;
