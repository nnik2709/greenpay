const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u."roleId", u."isActive", r.name as role
       FROM "User" u
       JOIN "Role" r ON u."roleId" = r.id
       WHERE u.id = $1 AND u."isActive" = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Role-based authorization middleware
const checkRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      if (result.rows.length === 0 || !roles.includes(result.rows[0].name)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = result.rows[0].name;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

module.exports = { auth, checkRole };
