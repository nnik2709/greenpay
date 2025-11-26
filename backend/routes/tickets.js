const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all tickets
router.get('/',
  auth,
  async (req, res) => {
    try {
      const { status, priority, category } = req.query;

      let query = `
        SELECT t.*, u.name as created_by_name, a.name as assigned_to_name
        FROM tickets t
        LEFT JOIN "User" u ON t.created_by = u.id
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
        query += ` AND t.created_by = $${paramCount++}`;
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
         LEFT JOIN "User" u ON t.created_by = u.id
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
      if (!['Flex_Admin', 'IT_Support'].includes(userRole) && ticket.created_by !== req.userId) {
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
        priority,
        attachments
      } = req.body;

      const result = await db.query(
        `INSERT INTO tickets (
          title, description, category, priority, status,
          attachments, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          title,
          description,
          category,
          priority || 'medium',
          'open',
          JSON.stringify(attachments || []),
          req.userId
        ]
      );

      res.status(201).json({ data: result.rows[0] });
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
        assigned_to,
        resolution_notes,
        attachments
      } = req.body;

      // Check if user has permission to update this ticket
      const ticketResult = await db.query('SELECT created_by FROM tickets WHERE id = $1', [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const userRoleResult = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      const userRole = userRoleResult.rows[0]?.name;
      const isOwner = ticketResult.rows[0].created_by === req.userId;

      // Only owner or admin/IT can update
      if (!['Flex_Admin', 'IT_Support'].includes(userRole) && !isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
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

        // Set resolved_at when status changes to resolved
        if (status === 'resolved') {
          updates.push(`resolved_at = NOW()`);
        }
      }
      if (assigned_to !== undefined && ['Flex_Admin', 'IT_Support'].includes(userRole)) {
        updates.push(`assigned_to = $${paramCount++}`);
        values.push(assigned_to);
      }
      if (resolution_notes !== undefined) {
        updates.push(`resolution_notes = $${paramCount++}`);
        values.push(resolution_notes);
      }
      if (attachments !== undefined) {
        updates.push(`attachments = $${paramCount++}`);
        values.push(JSON.stringify(attachments));
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
      res.json({ data: result.rows[0] });
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

// Add comment to ticket
router.post('/:id/comments',
  auth,
  [
    body('comment').notEmpty().withMessage('Comment is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      // Check if ticket exists and user has access
      const ticketResult = await db.query('SELECT created_by FROM tickets WHERE id = $1', [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const userRoleResult = await db.query(
        'SELECT r.name FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1',
        [req.userId]
      );

      const userRole = userRoleResult.rows[0]?.name;
      const isOwner = ticketResult.rows[0].created_by === req.userId;

      if (!['Flex_Admin', 'IT_Support'].includes(userRole) && !isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get current comments
      const ticket = await db.query('SELECT comments FROM tickets WHERE id = $1', [id]);
      const currentComments = ticket.rows[0].comments || [];

      const newComment = {
        id: Date.now(),
        user_id: req.userId,
        comment,
        created_at: new Date().toISOString()
      };

      currentComments.push(newComment);

      // Update ticket with new comment
      const result = await db.query(
        'UPDATE tickets SET comments = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(currentComments), id]
      );

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

module.exports = router;
