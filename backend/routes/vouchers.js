const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

/**
 * Validate a voucher code
 * GET /api/vouchers/validate/:code
 */
router.get('/validate/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Voucher code is required.'
      });
    }

    const trimmedCode = code.trim();

    // Try individual purchases first
    const individualResult = await db.query(
      `SELECT
        id,
        "voucherCode" as voucher_code,
        "passportNumber" as passport_number,
        "fullName" as full_name,
        "validUntil" as valid_until,
        "usedAt" as used_at,
        "createdAt" as created_at,
        amount,
        status
      FROM "IndividualPurchase"
      WHERE "voucherCode" = $1`,
      [trimmedCode]
    );

    // Try corporate vouchers if not found in individual purchases
    const corporateResult = await db.query(
      `SELECT
        id,
        "voucherCode" as voucher_code,
        "passportNumber" as passport_number,
        "companyName" as company_name,
        "validUntil" as valid_until,
        "usedAt" as used_at,
        "createdAt" as created_at,
        amount,
        status
      FROM "CorporateVoucher"
      WHERE "voucherCode" = $1`,
      [trimmedCode]
    );

    const voucherData = individualResult.rows[0] || corporateResult.rows[0];
    const voucherType = individualResult.rows[0] ? 'Individual' : corporateResult.rows[0] ? 'Corporate' : null;

    if (!voucherData) {
      return res.json({
        type: 'error',
        status: 'error',
        message: 'Voucher code not found.'
      });
    }

    // Check if voucher has been used
    if (voucherData.used_at) {
      const usedDate = new Date(voucherData.used_at).toLocaleDateString();
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `${voucherType} voucher has already been used on ${usedDate}.`,
        data: { ...voucherData, voucherType }
      });
    }

    // Check if voucher has expired
    const now = new Date();
    const expiryDate = new Date(voucherData.valid_until);
    if (expiryDate < now) {
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `${voucherType} voucher has expired on ${expiryDate.toLocaleDateString()}.`,
        data: { ...voucherData, voucherType }
      });
    }

    // Voucher is valid
    return res.json({
      type: 'voucher',
      status: 'success',
      message: `${voucherType} voucher is valid and ready to use!`,
      data: { ...voucherData, voucherType }
    });

  } catch (error) {
    console.error('Voucher validation error:', error);
    return res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Error validating voucher. Please try again.'
    });
  }
});

/**
 * Mark voucher as used
 * POST /api/vouchers/mark-used/:code
 */
router.post('/mark-used/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Voucher code is required.' });
    }

    const trimmedCode = code.trim();

    // Try to update individual purchase
    const individualResult = await db.query(
      `UPDATE "IndividualPurchase"
       SET "usedAt" = NOW(), status = 'used'
       WHERE "voucherCode" = $1 AND "usedAt" IS NULL
       RETURNING id, "voucherCode"`,
      [trimmedCode]
    );

    if (individualResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Individual voucher marked as used.',
        voucher: individualResult.rows[0]
      });
    }

    // Try to update corporate voucher
    const corporateResult = await db.query(
      `UPDATE "CorporateVoucher"
       SET "usedAt" = NOW(), status = 'used'
       WHERE "voucherCode" = $1 AND "usedAt" IS NULL
       RETURNING id, "voucherCode"`,
      [trimmedCode]
    );

    if (corporateResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Corporate voucher marked as used.',
        voucher: corporateResult.rows[0]
      });
    }

    // Voucher not found or already used
    return res.status(404).json({
      error: 'Voucher not found or already used.'
    });

  } catch (error) {
    console.error('Mark voucher used error:', error);
    return res.status(500).json({
      error: 'Error marking voucher as used. Please try again.'
    });
  }
});

module.exports = router;
