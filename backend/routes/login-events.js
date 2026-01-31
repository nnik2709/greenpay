const express = require('express');
const { serverError } = require('../utils/apiResponse');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

/**
 * GET /api/login-events
 * Get all login events (with optional user filter)
 * Accessible by Flex_Admin and IT_Support
 */
router.get('/', auth, checkRole('Flex_Admin', 'IT_Support'), async (req, res) => {
  try {
    const { userId, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        le.*,
        u.name as user_name,
        u.email as user_email,
        r.name as role
      FROM login_events le
      LEFT JOIN "User" u ON le.user_id = u.id
      LEFT JOIN "Role" r ON u."roleId" = r.id
    `;

    const params = [];

    // Filter by user if specified
    if (userId) {
      query += ` WHERE le.user_id = $1`;
      params.push(userId);
      query += ` ORDER BY le.login_time DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY le.login_time DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM login_events';
    const countParams = [];
    if (userId) {
      countQuery += ' WHERE user_id = $1';
      countParams.push(userId);
    }
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      type: 'success',
      loginEvents: result.rows,
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching login events:', error);
    return serverError(res, error, 'Failed to fetch login events');
  }
});

/**
 * GET /api/login-events/user/:userId
 * Get login events for a specific user
 * Accessible by Flex_Admin and IT_Support
 */
router.get('/user/:userId', auth, checkRole('Flex_Admin', 'IT_Support'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT
        le.*,
        u.name as user_name,
        u.email as user_email,
        r.name as role
      FROM login_events le
      LEFT JOIN "User" u ON le.user_id = u.id
      LEFT JOIN "Role" r ON u."roleId" = r.id
      WHERE le.user_id = $1
      ORDER BY le.login_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

    // Get total count for this user
    const countResult = await db.query(
      'SELECT COUNT(*) FROM login_events WHERE user_id = $1',
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      type: 'success',
      loginEvents: result.rows,
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching user login events:', error);
    return serverError(res, error, 'Failed to fetch user login events');
  }
});

/**
 * GET /api/login-events/stats
 * Get login statistics
 * Accessible by Flex_Admin and IT_Support
 */
router.get('/stats', auth, checkRole('Flex_Admin', 'IT_Support'), async (req, res) => {
  try {
    // Get login stats for the last 30 days
    const statsQuery = `
      SELECT
        COUNT(*) as total_logins,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_logins,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_logins
      FROM login_events
      WHERE login_time >= NOW() - INTERVAL '30 days'
    `;

    const result = await db.query(statsQuery);

    res.json({
      type: 'success',
      stats: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching login stats:', error);
    return serverError(res, error, 'Failed to fetch login statistics');
  }
});

module.exports = router;
