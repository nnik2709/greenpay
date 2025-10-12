import { supabase } from './supabaseClient';

/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 * Buckets: passport-photos, passport-signatures
 */

const BUCKETS = {
  PASSPORT_PHOTOS: 'passport-photos',
  PASSPORT_SIGNATURES: 'passport-signatures',
  VOUCHER_BATCHES: 'voucher-batches'
};

const MAX_FILE_SIZE = {
  PHOTO: 2 * 1024 * 1024, // 2MB
  SIGNATURE: 1 * 1024 * 1024, // 1MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
};

/**
 * Upload passport photo
 * @param {File} file - File object from input
 * @param {string} passportNumber - Passport number for file naming
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadPassportPhoto(file, passportNumber) {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE.PHOTO) {
      throw new Error(`Photo size must be less than ${MAX_FILE_SIZE.PHOTO / 1024 / 1024}MB`);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Photo must be JPEG or PNG format');
    }

    // Generate unique file name
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${passportNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${ext}`;
    const filePath = `photos/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKETS.PASSPORT_PHOTOS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.PASSPORT_PHOTOS)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Upload passport signature
 * @param {File} file - File object from input
 * @param {string} passportNumber - Passport number for file naming
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadPassportSignature(file, passportNumber) {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE.SIGNATURE) {
      throw new Error(`Signature size must be less than ${MAX_FILE_SIZE.SIGNATURE / 1024 / 1024}MB`);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Signature must be JPEG or PNG format');
    }

    // Generate unique file name
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${passportNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${ext}`;
    const filePath = `signatures/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKETS.PASSPORT_SIGNATURES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.PASSPORT_SIGNATURES)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading signature:', error);
    throw error;
  }
}

/**
 * Delete file from storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 */
export async function deleteFile(bucket, filePath) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get public URL for file
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 * @returns {string} Public URL
 */
export function getPublicUrl(bucket, filePath) {
  if (!filePath) return null;
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload voucher batch PDF
 * @param {Blob} pdfBlob - PDF blob
 * @param {string} batchId - Batch ID for file naming
 */
export async function uploadVoucherBatchPdf(pdfBlob, batchId) {
  try {
    const fileName = `batch_${batchId}_${Date.now()}.pdf`;
    const filePath = `batches/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKETS.VOUCHER_BATCHES)
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(BUCKETS.VOUCHER_BATCHES)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {number} maxSize - Max size in bytes
 * @returns {boolean}
 */
export function validateImageFile(file, maxSize) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (!file) {
    throw new Error('No file selected');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG or PNG format');
  }

  if (file.size > maxSize) {
    const maxMB = maxSize / 1024 / 1024;
    throw new Error(`File size must be less than ${maxMB}MB`);
  }

  return true;
}

/**
 * Create storage buckets (run once during setup)
 * Note: This should be run via Supabase Dashboard or during initial setup
 */
export async function initializeStorageBuckets() {
  const buckets = [
    { name: BUCKETS.PASSPORT_PHOTOS, public: true },
    { name: BUCKETS.PASSPORT_SIGNATURES, public: true },
    { name: BUCKETS.VOUCHER_BATCHES, public: true }
  ];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.name === BUCKETS.VOUCHER_BATCHES ? MAX_FILE_SIZE.DOCUMENT : MAX_FILE_SIZE.PHOTO
      });

      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating bucket ${bucket.name}:`, error);
      } else {
        console.log(`✓ Bucket ${bucket.name} ready`);
      }
    } catch (error) {
      console.error(`Error with bucket ${bucket.name}:`, error);
    }
  }
}

export { BUCKETS, MAX_FILE_SIZE };

