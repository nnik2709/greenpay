/**
 * Field-Level Encryption Utility for PII Data
 *
 * Uses AES-256-GCM for authenticated encryption of sensitive fields
 * such as passport numbers, emails, phone numbers, and names.
 *
 * Security Features:
 * - AES-256-GCM (authenticated encryption)
 * - Unique IV per encryption operation
 * - Authentication tag verification on decryption
 * - Constant-time key derivation (PBKDF2)
 *
 * Usage:
 *   const { encryptField, decryptField } = require('./utils/encryption');
 *
 *   // Encrypt
 *   const encrypted = encryptField('AB123456'); // Passport number
 *   // Store encrypted object in JSONB column
 *
 *   // Decrypt
 *   const plaintext = decryptField(encrypted);
 */

const crypto = require('crypto');

// Configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const PBKDF2_ITERATIONS = 100000;

/**
 * Get encryption key from environment
 * Key must be 32 bytes (64 hex characters)
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string field
 *
 * @param {string} plaintext - The text to encrypt
 * @returns {Object} Encrypted data object with iv, encryptedData, and authTag
 */
function encryptField(plaintext) {
  if (!plaintext || plaintext === null || plaintext === undefined) {
    return null;
  }

  if (typeof plaintext !== 'string') {
    plaintext = String(plaintext);
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt field');
  }
}

/**
 * Decrypt an encrypted field object
 *
 * @param {Object} encryptedObject - Object with iv, encryptedData, and authTag
 * @returns {string} Decrypted plaintext
 */
function decryptField(encryptedObject) {
  if (!encryptedObject || encryptedObject === null) {
    return null;
  }

  // If already plaintext (during migration), return as-is
  if (typeof encryptedObject === 'string') {
    console.warn('Warning: Attempting to decrypt plaintext field (migration in progress?)');
    return encryptedObject;
  }

  if (!encryptedObject.iv || !encryptedObject.encryptedData || !encryptedObject.authTag) {
    throw new Error('Invalid encrypted object format');
  }

  try {
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedObject.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedObject.authTag, 'hex'));

    let decrypted = decipher.update(encryptedObject.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt field (data may be corrupted or key invalid)');
  }
}

/**
 * Encrypt multiple fields in an object
 *
 * @param {Object} data - Object containing fields to encrypt
 * @param {Array<string>} fields - Array of field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
function encryptFields(data, fields) {
  const encrypted = { ...data };

  fields.forEach(field => {
    if (data[field]) {
      encrypted[`${field}_encrypted`] = encryptField(data[field]);
      // Optionally remove plaintext
      delete encrypted[field];
    }
  });

  return encrypted;
}

/**
 * Decrypt multiple fields in an object
 *
 * @param {Object} data - Object containing encrypted fields
 * @param {Array<string>} fields - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
function decryptFields(data, fields) {
  const decrypted = { ...data };

  fields.forEach(field => {
    const encryptedField = `${field}_encrypted`;
    if (data[encryptedField]) {
      try {
        decrypted[field] = decryptField(data[encryptedField]);
        // Keep encrypted version for storage
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        decrypted[field] = null;
      }
    }
  });

  return decrypted;
}

/**
 * Hash a field for searching (one-way)
 * Use for fields that need to be searchable but not reversible
 *
 * @param {string} value - Value to hash
 * @returns {string} Hex-encoded hash
 */
function hashField(value) {
  if (!value) return null;

  const salt = process.env.HASH_SALT || 'greenpay-default-salt-change-me';
  return crypto
    .pbkdf2Sync(value, salt, PBKDF2_ITERATIONS, 32, 'sha256')
    .toString('hex');
}

/**
 * Generate a secure encryption key
 * Use this to generate ENCRYPTION_KEY for .env
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Test encryption/decryption with sample data
 */
function testEncryption() {
  console.log('🧪 Testing encryption utilities...\n');

  const testData = [
    { label: 'Passport Number', value: 'AB1234567' },
    { label: 'Email', value: 'john.doe@example.com' },
    { label: 'Phone', value: '+675 7123 4567' },
    { label: 'Name', value: 'John Doe' }
  ];

  testData.forEach(({ label, value }) => {
    console.log(`Testing: ${label}`);
    console.log(`  Original: ${value}`);

    const encrypted = encryptField(value);
    console.log(`  Encrypted: ${encrypted.encryptedData.substring(0, 20)}...`);
    console.log(`  IV: ${encrypted.iv}`);
    console.log(`  Auth Tag: ${encrypted.authTag}`);

    const decrypted = decryptField(encrypted);
    console.log(`  Decrypted: ${decrypted}`);
    console.log(`  ✅ Match: ${value === decrypted}\n`);
  });

  console.log('🔑 To generate a new encryption key, run:');
  console.log('   node -e "console.log(require(\'./utils/encryption\').generateEncryptionKey())"');
}

// Run test if executed directly
if (require.main === module) {
  if (!process.env.ENCRYPTION_KEY) {
    console.log('⚠️  ENCRYPTION_KEY not set. Generating a sample key for testing:\n');
    const sampleKey = generateEncryptionKey();
    console.log(`ENCRYPTION_KEY=${sampleKey}\n`);
    console.log('Add this to your .env file, then run this test again.\n');

    // Set for testing
    process.env.ENCRYPTION_KEY = sampleKey;
  }

  testEncryption();
}

module.exports = {
  encryptField,
  decryptField,
  encryptFields,
  decryptFields,
  hashField,
  generateEncryptionKey
};
