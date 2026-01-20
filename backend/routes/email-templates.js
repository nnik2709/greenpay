const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/email-templates
 * Get all email templates
 * Requires: Any authenticated user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { active_only } = req.query;

    let query = `
      SELECT
        et.*,
        creator.name as created_by_name,
        updater.name as updated_by_name
      FROM email_templates et
      LEFT JOIN "User" creator ON et.created_by = creator.id
      LEFT JOIN "User" updater ON et.updated_by = updater.id
    `;

    const params = [];

    if (active_only === 'true') {
      query += ' WHERE et.is_active = true';
    }

    query += ' ORDER BY et.name ASC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      templates: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

/**
 * GET /api/email-templates/:id
 * Get a specific email template by ID
 * Requires: Any authenticated user
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        et.*,
        creator.name as created_by_name,
        updater.name as updated_by_name
      FROM email_templates et
      LEFT JOIN "User" creator ON et.created_by = creator.id
      LEFT JOIN "User" updater ON et.updated_by = updater.id
      WHERE et.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

/**
 * GET /api/email-templates/name/:name
 * Get a specific email template by name
 * Requires: Any authenticated user
 */
router.get('/name/:name', auth, async (req, res) => {
  try {
    const { name } = req.params;

    const result = await db.query(
      `SELECT * FROM email_templates WHERE name = $1 AND is_active = true`,
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching email template by name:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

/**
 * POST /api/email-templates
 * Create a new email template
 * Requires: Flex_Admin only
 */
router.post('/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Template name is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('body').trim().notEmpty().withMessage('Body is required'),
    body('description').optional().trim(),
    body('variables').optional().isArray().withMessage('Variables must be an array'),
    body('is_active').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'Flex_Admin') {
        return res.status(403).json({ error: 'Only administrators can create email templates' });
      }

      const { name, description, subject, body, variables, is_active } = req.body;

      // Check if template with same name already exists
      const existingTemplate = await db.query(
        'SELECT id FROM email_templates WHERE name = $1',
        [name]
      );

      if (existingTemplate.rows.length > 0) {
        return res.status(400).json({ error: 'A template with this name already exists' });
      }

      const result = await db.query(
        `INSERT INTO email_templates
          (name, description, subject, body, variables, is_active, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          name,
          description || null,
          subject,
          body,
          JSON.stringify(variables || []),
          is_active !== undefined ? is_active : true,
          req.user.id,
          req.user.id
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        template: result.rows[0]
      });

    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  }
);

/**
 * PUT /api/email-templates/:id
 * Update an email template
 * Requires: Flex_Admin only
 */
router.put('/:id',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('subject').optional().trim().notEmpty(),
    body('body').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('variables').optional().isArray(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'Flex_Admin') {
        return res.status(403).json({ error: 'Only administrators can update email templates' });
      }

      const { id } = req.params;
      const { name, description, subject, body, variables, is_active } = req.body;

      // Check if template exists
      const templateCheck = await db.query(
        'SELECT id FROM email_templates WHERE id = $1',
        [id]
      );

      if (templateCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Email template not found' });
      }

      // If name is being changed, check for duplicates
      if (name) {
        const duplicateCheck = await db.query(
          'SELECT id FROM email_templates WHERE name = $1 AND id != $2',
          [name, id]
        );

        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({ error: 'A template with this name already exists' });
        }
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (subject !== undefined) {
        updates.push(`subject = $${paramIndex++}`);
        values.push(subject);
      }
      if (body !== undefined) {
        updates.push(`body = $${paramIndex++}`);
        values.push(body);
      }
      if (variables !== undefined) {
        updates.push(`variables = $${paramIndex++}`);
        values.push(JSON.stringify(variables));
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      updates.push(`updated_by = $${paramIndex++}`);
      values.push(req.user.id);

      values.push(id);

      const query = `
        UPDATE email_templates
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);

      res.json({
        success: true,
        message: 'Email template updated successfully',
        template: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  }
);

/**
 * DELETE /api/email-templates/:id
 * Delete an email template
 * Requires: Flex_Admin only
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Flex_Admin') {
      return res.status(403).json({ error: 'Only administrators can delete email templates' });
    }

    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM email_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    res.json({
      success: true,
      message: 'Email template deleted successfully',
      template: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

/**
 * POST /api/email-templates/:id/preview
 * Preview an email template with sample data
 * Requires: Any authenticated user
 */
router.post('/:id/preview',
  auth,
  [
    body('variables').isObject().withMessage('Variables must be an object')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      const result = await db.query(
        'SELECT subject, body FROM email_templates WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Email template not found' });
      }

      const template = result.rows[0];

      // Replace variables in subject and body
      let previewSubject = template.subject;
      let previewBody = template.body;

      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key];
        previewSubject = previewSubject.replaceAll(placeholder, value);
        previewBody = previewBody.replaceAll(placeholder, value);
      });

      res.json({
        success: true,
        preview: {
          subject: previewSubject,
          body: previewBody
        }
      });

    } catch (error) {
      console.error('Error previewing email template:', error);
      res.status(500).json({ error: 'Failed to preview email template' });
    }
  }
);

/**
 * POST /api/email-templates/:id/send-test
 * Send a test email using the template
 * Requires: Flex_Admin only
 */
router.post('/:id/send-test',
  auth,
  [
    body('email').isEmail().withMessage('Valid email address required'),
    body('variables').isObject().withMessage('Variables must be an object')
  ],
  validate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'Flex_Admin') {
        return res.status(403).json({ error: 'Only administrators can send test emails' });
      }

      const { id } = req.params;
      const { email, variables } = req.body;

      const result = await db.query(
        'SELECT subject, body FROM email_templates WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Email template not found' });
      }

      const template = result.rows[0];

      // Replace variables in subject and body
      let emailSubject = template.subject;
      let emailBody = template.body;

      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key];
        emailSubject = emailSubject.replaceAll(placeholder, value);
        emailBody = emailBody.replaceAll(placeholder, value);
      });

      // Send email using notification service
      const notificationService = require('../services/notificationService');
      await notificationService.sendEmail({
        to: email,
        subject: `[TEST] ${emailSubject}`,
        html: emailBody
      });

      res.json({
        success: true,
        message: `Test email sent to ${email}`
      });

    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  }
);

module.exports = router;
