/**
 * Storage Service
 * Handles file uploads to backend server filesystem
 * Replaces Supabase Storage with server-side file storage
 */

import { API_URL as API_BASE_URL } from '@/config/urls';

export const MAX_FILE_SIZE = {
  PHOTO: 2 * 1024 * 1024, // 2MB
  SIGNATURE: 1 * 1024 * 1024, // 1MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean}
 */
export function validateImageFile(file, maxSize = MAX_FILE_SIZE.PHOTO) {
  if (!file) return false;

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG or PNG format');
  }

  return true;
}

/**
 * Upload passport photo to backend server
 * @param {File} file - File object from input
 * @param {string} passportNumber - Passport number for file naming
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadPassportPhoto(file, passportNumber) {
  try {
    // Validate file
    validateImageFile(file, MAX_FILE_SIZE.PHOTO);

    // Generate unique file name
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${passportNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${ext}`;

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', fileName);
    formData.append('type', 'passport-photo');

    // Get auth token
    const token = localStorage.getItem('greenpay_auth_token');

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();

    return {
      path: result.path || `uploads/passport-photos/${fileName}`,
      url: result.url || `${API_BASE_URL}/uploads/passport-photos/${fileName}`
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Upload passport signature to backend server
 * @param {File} file - File object from input
 * @param {string} passportNumber - Passport number for file naming
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadPassportSignature(file, passportNumber) {
  try {
    // Validate file
    validateImageFile(file, MAX_FILE_SIZE.SIGNATURE);

    // Generate unique file name
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${passportNumber.replace(/[^a-zA-Z0-9]/g, '_')}_sig_${timestamp}.${ext}`;

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', fileName);
    formData.append('type', 'passport-signature');

    // Get auth token
    const token = localStorage.getItem('greenpay_auth_token');

    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();

    return {
      path: result.path || `uploads/passport-signatures/${fileName}`,
      url: result.url || `${API_BASE_URL}/uploads/passport-signatures/${fileName}`
    };
  } catch (error) {
    console.error('Error uploading signature:', error);
    throw error;
  }
}

/**
 * Delete file from server
 * @param {string} filePath - Path to file to delete
 * @returns {Promise<boolean>}
 */
export async function deleteFile(filePath) {
  try {
    // Get auth token
    const token = localStorage.getItem('greenpay_auth_token');

    const response = await fetch(`${API_BASE_URL}/upload/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file URL
 * @param {string} filePath - Path to file
 * @returns {string}
 */
export function getFileUrl(filePath) {
  if (!filePath) return '';

  // If already a full URL, return as-is
  if (filePath.startsWith('http')) return filePath;

  // Otherwise construct URL
  return `${API_BASE_URL}/${filePath}`;
}
