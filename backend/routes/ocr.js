/**
 * OCR Routes - MRZ Passport Scanning with Python PaddleOCR Service
 *
 * Integrates with Python OCR microservice for high-accuracy MRZ extraction
 * Falls back to client-side Tesseract.js if Python service unavailable
 *
 * Endpoints:
 * - POST /api/ocr/scan-mrz - Upload passport image and extract MRZ data
 * - GET /api/ocr/health - Check OCR service status
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// ============================================================================
// HARDWARE SCANNER INTEGRATION (Laravel-compatible)
// For passport_ocr_service.exe / send_ocr_to_laravel.py
// ============================================================================

// In-memory cache for latest scan (simple implementation)
let latestScan = {
  data: null,
  timestamp: null
};

// WebSocket clients for real-time scan notifications
const scanListeners = new Set();

/**
 * Parse MRZ data (88 characters, 2 lines of 44)
 * ICAO 9303 TD3 Format for Passports
 */
function parseMrz(mrzRaw) {
  // Clean input - remove control characters, whitespace
  let mrz = mrzRaw.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, '');

  // Handle line breaks in MRZ (some scanners send with \r or \n)
  mrz = mrzRaw.replace(/[\r\n]+/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();

  if (mrz.length < 88) {
    console.warn(`[OCR] MRZ too short: ${mrz.length} chars (need 88)`);
    return null;
  }

  // Take first 88 characters
  mrz = mrz.substring(0, 88);

  // Split into lines
  const line1 = mrz.substring(0, 44);
  const line2 = mrz.substring(44, 88);

  try {
    // Line 1: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<
    const docType = line1.substring(0, 2);
    const issuingCountry = line1.substring(2, 5);
    const namesSection = line1.substring(5);
    const namesParts = namesSection.split('<<');
    const surname = (namesParts[0] || '').replace(/</g, ' ').trim();
    const givenName = (namesParts.slice(1).join(' ') || '').replace(/</g, ' ').trim();

    // Line 2: PASSPORTNUMBER<CHECK<NAT<DOBYYMMDDSEXEXPIRYYYMMDD<<<<<<<<<<<
    const passportNo = line2.substring(0, 9).replace(/</g, '').trim();
    const nationality = line2.substring(10, 13);
    const dobRaw = line2.substring(13, 19);
    const sex = line2.substring(20, 21);
    const expiryRaw = line2.substring(21, 27);

    // Convert dates (YYMMDD to YYYY-MM-DD)
    const currentYear = new Date().getFullYear() % 100;

    const dobYear = parseInt(dobRaw.substring(0, 2));
    const dobFullYear = dobYear > currentYear ? 1900 + dobYear : 2000 + dobYear;
    const dob = `${dobFullYear}-${dobRaw.substring(2, 4)}-${dobRaw.substring(4, 6)}`;

    const expiryYear = parseInt(expiryRaw.substring(0, 2));
    const expiryFullYear = expiryYear > 50 ? 1900 + expiryYear : 2000 + expiryYear;
    const dateOfExpiry = `${expiryFullYear}-${expiryRaw.substring(2, 4)}-${expiryRaw.substring(4, 6)}`;

    // Map sex code
    const sexMap = { 'M': 'Male', 'F': 'Female', '<': 'Other' };

    return {
      type: docType,
      passport_no: passportNo,
      surname: surname,
      given_name: givenName,
      nationality: nationality,
      dob: dob,
      sex: sexMap[sex] || sex,
      date_of_expiry: dateOfExpiry,
      issuing_country: issuingCountry,
      raw_mrz: mrz
    };
  } catch (error) {
    console.error('[OCR] MRZ parsing error:', error);
    return null;
  }
}

/**
 * Passport Scan - Receive MRZ data from hardware scanner
 * POST /api/ocr/passport-scan
 *
 * Compatible with Laravel's /passport-scan endpoint
 * Used by passport_ocr_service.exe / send_ocr_to_laravel.py
 *
 * Request: { "raw_data": "P<DNKNIKOLOV<<NIKOLAY<STOYANOV<<<<<<<<<<<<<<2123127819DNK6909275M3105250270969<2855<<<94" }
 * Response: { "status": "OK", "message": "Passport data saved", "passport_no": "212312781" }
 */
router.post('/passport-scan', async (req, res) => {
  try {
    const rawData = req.body.raw_data;

    if (!rawData) {
      console.warn('[OCR] Passport scan received without raw_data');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Missing raw_data field'
      });
    }

    console.log(`[OCR] Received MRZ scan: ${rawData.substring(0, 50)}...`);

    // Parse the MRZ data
    const parsed = parseMrz(rawData);

    if (!parsed) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Failed to parse MRZ data'
      });
    }

    console.log(`[OCR] Parsed passport: ${parsed.passport_no} - ${parsed.given_name} ${parsed.surname}`);

    // Store in cache for polling
    latestScan = {
      data: parsed,
      timestamp: Date.now()
    };

    // Notify WebSocket listeners
    scanListeners.forEach(callback => {
      try {
        callback(parsed);
      } catch (e) {
        console.error('[OCR] Error notifying listener:', e);
      }
    });

    // Return Laravel-compatible response
    res.json({
      status: 'OK',
      message: 'Passport data saved',
      passport_no: parsed.passport_no,
      data: parsed // Also include full parsed data for React app
    });

  } catch (error) {
    console.error('[OCR] Passport scan error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

/**
 * Get Latest Scan - Poll for new passport scans
 * GET /api/ocr/passport-scan/status
 *
 * Compatible with Laravel's /passport-scan/status endpoint
 *
 * Response: { "hasNewData": true, "ocrData": "212312781", "data": {...}, "timestamp": 1234567890 }
 */
router.get('/passport-scan/status', (req, res) => {
  const sinceTimestamp = parseInt(req.query.since) || 0;

  const hasNewData = latestScan.data && latestScan.timestamp > sinceTimestamp;

  res.json({
    hasNewData: hasNewData,
    ocrData: latestScan.data?.passport_no || null,
    data: hasNewData ? latestScan.data : null,
    timestamp: latestScan.timestamp || 0,
    status: 'connected'
  });
});

/**
 * Clear Latest Scan - Reset the cached scan
 * DELETE /api/ocr/passport-scan
 */
router.delete('/passport-scan', (req, res) => {
  latestScan = { data: null, timestamp: null };
  res.json({ status: 'OK', message: 'Scan cache cleared' });
});

/**
 * Register scan listener (for internal use by WebSocket handler)
 */
router.addScanListener = (callback) => {
  scanListeners.add(callback);
  return () => scanListeners.delete(callback);
};

/**
 * Get latest scan (for internal use)
 */
router.getLatestScan = () => latestScan;

// ============================================================================
// END HARDWARE SCANNER INTEGRATION
// ============================================================================

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Python OCR service URL
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:5000';
const OCR_TIMEOUT = parseInt(process.env.OCR_TIMEOUT || '30000'); // 30 seconds (increased for mobile devices)

/**
 * Health Check - Verify Python OCR service is available
 * GET /api/ocr/health
 */
router.get('/health', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${OCR_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(503).json({
        success: false,
        error: 'OCR service unavailable',
        serviceUrl: OCR_SERVICE_URL,
        statusCode: response.status
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      service: 'GreenPay OCR Integration',
      backend: data,
      serviceUrl: OCR_SERVICE_URL
    });

  } catch (error) {
    console.error('[OCR Health Check] Error:', error.message);

    res.status(503).json({
      success: false,
      error: 'OCR service unavailable',
      message: error.message,
      serviceUrl: OCR_SERVICE_URL,
      fallback: 'Client-side Tesseract.js available'
    });
  }
});

/**
 * Scan MRZ - Upload passport image and extract MRZ data
 * POST /api/ocr/scan-mrz
 *
 * Request:
 * - multipart/form-data
 * - file: passport image (JPG, PNG, max 10MB)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     passportNumber: "N1234567",
 *     surname: "SMITH",
 *     givenName: "JOHN ROBERT",
 *     nationality: "USA",
 *     dateOfBirth: "1985-03-15",
 *     sex: "M",
 *     dateOfExpiry: "2030-12-31",
 *     issuingCountry: "USA",
 *     confidence: 0.98
 *   },
 *   source: "python-ocr" | "fallback-required"
 * }
 */
router.post('/scan-mrz', upload.single('file'), async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        message: 'Please upload a passport image (JPG or PNG)'
      });
    }

    console.log(`[OCR] Scanning passport image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Create FormData for Python service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Call Python OCR service with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT);

    try {
      const response = await fetch(`${OCR_SERVICE_URL}/scan-mrz`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const data = await response.json();

      // Handle OCR service errors
      if (!response.ok) {
        console.warn(`[OCR] Python service returned error: ${response.status}`, data);

        // Return error with fallback suggestion
        return res.status(response.status).json({
          success: false,
          error: data.error || 'OCR processing failed',
          confidence: data.confidence || 0,
          source: 'python-ocr',
          fallback: 'client-tesseract',
          message: 'Try using client-side scanner or retake photo'
        });
      }

      // Success response from Python OCR
      const processingTime = Date.now() - startTime;

      // Handle both camelCase and snake_case field names from Python
      const passportNumber = data.passportNumber || data.passport_number || data.documentNumber || data.document_number;
      const givenName = data.givenName || data.given_name;
      const dateOfBirth = data.dateOfBirth || data.date_of_birth;
      const dateOfExpiry = data.dateOfExpiry || data.date_of_expiry;
      const issuingCountry = data.issuingCountry || data.issuing_country;
      const personalNumber = data.personalNumber || data.personal_number;
      const validCheckDigits = data.validCheckDigits || data.valid_check_digits;
      const mrzText = data.mrzText || data.mrz_text;

      console.log(`[OCR] Python service response:`, JSON.stringify(data, null, 2));
      console.log(`[OCR] Successfully extracted MRZ: ${passportNumber} (${data.confidence * 100}% confidence, ${processingTime}ms)`);

      res.json({
        success: true,
        data: {
          passportNumber: passportNumber,
          surname: data.surname,
          givenName: givenName,
          nationality: data.nationality,
          dateOfBirth: dateOfBirth,
          sex: data.sex,
          dateOfExpiry: dateOfExpiry,
          issuingCountry: issuingCountry,
          personalNumber: personalNumber,
          confidence: data.confidence,
          validCheckDigits: validCheckDigits,
          mrzText: mrzText
        },
        source: 'python-ocr',
        processingTime: processingTime,
        ocrProcessingTime: data.processingTime || data.processing_time
      });

    } catch (fetchError) {
      clearTimeout(timeout);

      // Python service unavailable - suggest fallback
      console.error('[OCR] Python service unavailable:', fetchError.message);

      return res.status(503).json({
        success: false,
        error: 'OCR service temporarily unavailable',
        message: fetchError.name === 'AbortError'
          ? `OCR processing timeout (>${OCR_TIMEOUT/1000}s)`
          : 'Python OCR service not responding',
        fallback: 'client-tesseract',
        suggestion: 'Please use client-side scanner or try again later',
        serviceUrl: OCR_SERVICE_URL
      });
    }

  } catch (error) {
    console.error('[OCR] Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      fallback: 'client-tesseract'
    });
  }
});

/**
 * Test endpoint - Verify file upload works (development only)
 * POST /api/ocr/test-upload
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: `${req.file.buffer.length} bytes`
      }
    });
  });
}

module.exports = router;
