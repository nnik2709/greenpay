const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Helper function to generate ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

// Helper function to check if user is admin or IT support
const isAdminOrSupport = (userRole) => {
  return ['Flex_Admin', 'IT_Support'].includes(userRole);
};

// GET /api/tickets - Get all tickets (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params;

    // Admins and IT Support see all tickets, others see only their own
    if (isAdminOrSupport(userRole)) {
      query = `
        SELECT t.*, u.email as creator_email, u.name as creator_name
        FROM "Ticket" t
        LEFT JOIN "User" u ON t."createdBy" = u.id
        ORDER BY t."createdAt" DESC
      `;
      params = [];
    } else {
      query = `
        SELECT t.*, u.email as creator_email, u.name as creator_name
        FROM "Ticket" t
        LEFT JOIN "User" u ON t."createdBy" = u.id
        WHERE t."createdBy" = $1
        ORDER BY t."createdAt" DESC
      `;
      params = [userId];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id - Get single ticket with responses
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get ticket
    const ticketResult = await db.query(
      `SELECT t.*, u.email as creator_email, u.name as creator_name
       FROM "Ticket" t
       LEFT JOIN "User" u ON t."createdBy" = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Check access permissions
    if (!isAdminOrSupport(userRole) && ticket.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get responses
    const responsesResult = await db.query(
      `SELECT tr.*, u.name as user_name, u.email as user_email
       FROM "TicketResponse" tr
       LEFT JOIN "User" u ON tr."userId" = u.id
       WHERE tr."ticketId" = $1
       ORDER BY tr."createdAt" ASC`,
      [id]
    );

    ticket.responses = responsesResult.rows;

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets - Create new ticket
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ticketNumber = generateTicketNumber();

    const result = await db.query(
      `INSERT INTO "Ticket"
       ("ticketNumber", title, description, priority, status, "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'open', $5, NOW(), NOW())
       RETURNING *`,
      [ticketNumber, title, description, priority || 'medium', userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if ticket exists and get creator
    const checkResult = await db.query('SELECT "createdBy" FROM "Ticket" WHERE id = $1', [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = checkResult.rows[0];

    // Only ticket creator or admin/IT support can update
    if (!isAdminOrSupport(userRole) && ticket.createdBy !== userId) {
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
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(id);

    const query = `UPDATE "Ticket" SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// POST /api/tickets/:id/responses - Add response to ticket
router.post('/:id/responses', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, is_staff_response } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if ticket exists and get creator
    const ticketResult = await db.query('SELECT "createdBy" FROM "Ticket" WHERE id = $1', [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Only ticket creator or admin/IT support can add responses
    if (!isAdminOrSupport(userRole) && ticket.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine if this is a staff response
    const isStaffResponse = is_staff_response && isAdminOrSupport(userRole);

    // Insert response
    const result = await db.query(
      `INSERT INTO "TicketResponse"
       ("ticketId", "userId", message, "isStaffResponse", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, userId, message, isStaffResponse]
    );

    // Update ticket's updatedAt
    await db.query('UPDATE "Ticket" SET "updatedAt" = NOW() WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// DELETE /api/tickets/:id - Delete ticket (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Only Flex_Admin can delete tickets
    if (userRole !== 'Flex_Admin') {
      return res.status(403).json({ error: 'Only administrators can delete tickets' });
    }

    const result = await db.query('DELETE FROM "Ticket" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
