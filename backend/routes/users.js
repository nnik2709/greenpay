const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all users (with role information)
router.get('/',
  auth,
  checkRole('Flex_Admin', 'IT_Support'),
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.name, u.email, u."roleId", u."isActive", u."createdAt", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         ORDER BY u."createdAt" DESC`
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get single user by ID
router.get('/:id',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT u.id, u.name, u.email, u."roleId", u."isActive", u."createdAt", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         WHERE u.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// Create new user
router.post('/',
  auth,
  checkRole('Flex_Admin', 'IT_Support'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('roleId').isInt().withMessage('Role ID is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, roleId, isActive = true } = req.body;

      // Check if email already exists
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
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, name, email, "roleId", "isActive", "createdAt"`,
        [name, email, hashedPassword, roleId, isActive]
      );

      // Get role name
      const userWithRole = await db.query(
        `SELECT u.id, u.name, u.email, u."roleId", u."isActive", u."createdAt", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         WHERE u.id = $1`,
        [result.rows[0].id]
      );

      res.status(201).json({ data: userWithRole.rows[0] });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Update user
router.put('/:id',
  auth,
  checkRole('Flex_Admin', 'IT_Support'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('roleId').optional().isInt().withMessage('Role ID must be an integer')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, roleId, isActive } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (email !== undefined) {
        // Check if email already exists for another user
        const existingUser = await db.query(
          'SELECT id FROM "User" WHERE email = $1 AND id != $2',
          [email, id]
        );
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (roleId !== undefined) {
        updates.push(`"roleId" = $${paramCount++}`);
        values.push(roleId);
      }
      if (isActive !== undefined) {
        updates.push(`"isActive" = $${paramCount++}`);
        values.push(isActive);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `
        UPDATE "User"
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get updated user with role
      const updatedUser = await db.query(
        `SELECT u.id, u.name, u.email, u."roleId", u."isActive", u."createdAt", r.name as role
         FROM "User" u
         JOIN "Role" r ON u."roleId" = r.id
         WHERE u.id = $1`,
        [id]
      );

      res.json({ data: updatedUser.rows[0] });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Delete user (soft delete by setting isActive = false)
router.delete('/:id',
  auth,
  checkRole('Flex_Admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (parseInt(id) === req.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const result = await db.query(
        'UPDATE "User" SET "isActive" = false WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

// Get all roles
router.get('/roles/list',
  auth,
  async (req, res) => {
    try {
      const result = await db.query(
        'SELECT id, name, description FROM "Role" ORDER BY name'
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
);

module.exports = router;
