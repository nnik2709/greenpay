const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');
const { sendTicketNotification } = require('../services/notificationService');

// Get all tickets
router.get('/',
  auth,
  async (req, res) => {
    try {
      const { status, priority, category } = req.query;

      let query = `
        SELECT t.*, u.name as created_by_name, a.name as assigned_to_name
        FROM tickets t
        LEFT JOIN "User" u ON t.user_id = u.id
        LEFT JOIN "User" a ON t.assigned_to = a.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // Regular users can only see their own tickets
      // Admin and IT_Support can see all tickets
      const userRoleResult = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      const userRole = userRoleResult.rows[0]?.name;
      if (!['Flex_Admin', 'IT_Support'].includes(userRole)) {
        query += ` AND t.user_id = $${paramCount++}`;
        params.push(req.userId);
      }

      if (status) {
        query += ` AND t.status = $${paramCount++}`;
        params.push(status);
      }

      if (priority) {
        query += ` AND t.priority = $${paramCount++}`;
        params.push(priority);
      }

      if (category) {
        query += ` AND t.category = $${paramCount++}`;
        params.push(category);
      }

      query += ' ORDER BY t.created_at DESC';

      const result = await db.query(query, params);
      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }
);

// Get single ticket by ID
router.get('/:id',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT t.*, u.name as created_by_name, a.name as assigned_to_name
         FROM tickets t
         LEFT JOIN "User" u ON t.user_id = u.id
         LEFT JOIN "User" a ON t.assigned_to = a.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticket = result.rows[0];

      // Check if user has permission to view this ticket
      const userRoleResult = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      const userRole = userRoleResult.rows[0]?.name;
      if (!['Flex_Admin', 'IT_Support'].includes(userRole) && ticket.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ data: ticket });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }
);

// Create new ticket
router.post('/',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['technical', 'billing', 'feature_request', 'other']).withMessage('Invalid category'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
  ],
  validate,
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        priority
      } = req.body;

      // Generate ticket number
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const ticketNumber = `TKT-${timestamp}-${random}`;

      const result = await db.query(
        `INSERT INTO tickets (
          ticket_number, subject, description, category, priority, status,
          user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`,
        [
          ticketNumber,
          title,  // Map title to subject column
          description,
          category,
          priority || 'medium',
          'open',
          req.userId
        ]
      );

      const ticket = result.rows[0];

      // Get user information for email notification
      const userResult = await db.query(
        'SELECT id, name, email FROM "User" WHERE id = $1',
        [req.userId]
      );

      const user = userResult.rows[0];

      // Send email notification to IT Support (non-blocking)
      if (user) {
        // Map production schema to expected format for email
        const ticketForEmail = {
          ...ticket,
          title: ticket.subject,  // Map subject back to title for email template
          created_by: ticket.user_id
        };

        sendTicketNotification(ticketForEmail, user)
          .then(() => {
            console.log('✅ Ticket notification email sent');
          })
          .catch((error) => {
            console.error('⚠️ Ticket notification email failed (non-critical):', error.message);
          });
      }

      // Return ticket with title mapped from subject for frontend compatibility
      res.status(201).json({
        data: {
          ...ticket,
          title: ticket.subject,  // Frontend expects 'title'
          created_by: ticket.user_id
        }
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  }
);

// Update ticket
router.put('/:id',
  auth,
  [
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('category').optional().isIn(['technical', 'billing', 'feature_request', 'other']).withMessage('Invalid category')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        priority,
        status,
        assigned_to
      } = req.body;

      // Check if user has permission to update this ticket
      const ticketResult = await db.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const userRoleResult = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      const userRole = userRoleResult.rows[0]?.name;
      const isOwner = ticketResult.rows[0].user_id === req.userId;

      // Only owner or admin/IT can update
      if (!['Flex_Admin', 'IT_Support'].includes(userRole) && !isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`subject = $${paramCount++}`);  // Map title to subject
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (category !== undefined) {
        updates.push(`category = $${paramCount++}`);
        values.push(category);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramCount++}`);
        values.push(priority);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);

        // Set closed_at when status changes to closed
        if (status === 'closed') {
          updates.push(`closed_at = NOW()`);
        }
      }
      if (assigned_to !== undefined && ['Flex_Admin', 'IT_Support'].includes(userRole)) {
        updates.push(`assigned_to = $${paramCount++}`);
        values.push(assigned_to);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `
        UPDATE tickets
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);

      // Map subject to title for frontend compatibility
      const ticket = result.rows[0];
      res.json({
        data: {
          ...ticket,
          title: ticket.subject,
          created_by: ticket.user_id
        }
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  }
);

// Delete ticket (admin only)
router.delete('/:id',
  auth,
  checkRole('Flex_Admin', 'IT_Support'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM tickets WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Failed to delete ticket' });
    }
  }
);

module.exports = router;
