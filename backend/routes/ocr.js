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
const OCR_TIMEOUT = parseInt(process.env.OCR_TIMEOUT || '10000'); // 10 seconds

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
          ? 'OCR processing timeout (>10s)'
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
