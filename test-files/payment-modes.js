const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "PaymentMode" ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({ error: 'Failed to fetch payment modes' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, collectCardDetails, active } = req.body;
    const result = await db.query('INSERT INTO "PaymentMode" (name, "collectCardDetails", active, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *', [name.toUpperCase().trim(), collectCardDetails || false, active !== false]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding payment mode:', error);
    res.status(500).json({ error: 'Failed to add payment mode' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, collectCardDetails, active } = req.body;
    const result = await db.query('UPDATE "PaymentMode" SET name = $1, "collectCardDetails" = $2, active = $3, "updatedAt" = NOW() WHERE id = $4 RETURNING *', [name.toUpperCase().trim(), collectCardDetails, active, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment mode not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment mode:', error);
    res.status(500).json({ error: 'Failed to update payment mode' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM "PaymentMode" WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment mode not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment mode:', error);
    res.status(500).json({ error: 'Failed to delete payment mode' });
  }
});

module.exports = router;
