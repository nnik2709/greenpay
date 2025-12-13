const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "SystemSettings" ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({ voucherValidityDays: 30, defaultAmount: 50.00, createdAt: new Date(), updatedAt: new Date() });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { voucher_validity_days, default_amount } = req.body;
    const existing = await db.query('SELECT id FROM "SystemSettings" LIMIT 1');
    if (existing.rows.length === 0) {
      const result = await db.query('INSERT INTO "SystemSettings" ("voucherValidityDays", "defaultAmount", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING *', [voucher_validity_days, default_amount]);
      return res.json(result.rows[0]);
    } else {
      const result = await db.query('UPDATE "SystemSettings" SET "voucherValidityDays" = $1, "defaultAmount" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *', [voucher_validity_days, default_amount, existing.rows[0].id]);
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
