import { supabase } from './supabaseClient';

/**
 * Bulk Upload Service
 * Handles Excel/CSV passport bulk uploads via Edge Function
 */

/**
 * Parse CSV file locally
 */
async function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('File is empty or has no data'));
          return;
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim());
        
        // Parse rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          header.forEach((key, index) => {
            row[key] = values[index] || '';
          });
          rows.push(row);
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Upload and process bulk passport file
 * @param {File} file - Excel or CSV file
 * @returns {Promise<{success: boolean, passports: Array, errors: Array, totalProcessed: number, successCount: number, errorCount: number}>}
 */
export async function uploadBulkPassports(file) {
  console.log('Starting bulk upload for file:', file.name);
  
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const allowedExtensions = ['xls', 'xlsx', 'csv'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Only Excel (.xlsx, .xls) and CSV files are supported');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Database connection not available');
    }

    // Get current session
    console.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication failed. Please refresh and try again.');
    }
    
    if (!session || !session.user) {
      console.error('No session or user found');
      throw new Error('Not authenticated. Please log in.');
    }
    
    const user = session.user;
    console.log('User authenticated:', user.email, 'ID:', user.id);

    // Try Edge Function first (if deployed) - Skip for now, use local processing
    // Edge Function requires deployment which we'll do later
    // For now, we'll use local CSV processing which works perfectly

    // Fallback: Process locally (for CSV files)
    if (fileExtension !== 'csv') {
      throw new Error('Excel files require the Edge Function to be deployed. Please use CSV files or deploy the Edge Function.');
    }

    console.log('Processing CSV locally...', {
      fileName: file.name,
      fileSize: file.size,
      userId: user.id
    });
    
    const rows = await parseCSVFile(file);
    console.log('CSV parsed successfully, rows:', rows.length);
    
    const errors = [];
    const validRows = [];
    
    // Validate and transform rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = [];
      
      // Validate required fields
      if (!row.passportNo || row.passportNo.length < 5) {
        rowErrors.push(`Row ${i + 1}: Passport number is required (min 5 characters)`);
      }
      if (!row.surname) rowErrors.push(`Row ${i + 1}: Surname is required`);
      if (!row.givenName) rowErrors.push(`Row ${i + 1}: Given name is required`);
      if (!row.nationality) rowErrors.push(`Row ${i + 1}: Nationality is required`);
      if (!row.dob) rowErrors.push(`Row ${i + 1}: Date of birth is required`);
      if (!row.sex) rowErrors.push(`Row ${i + 1}: Sex is required`);
      if (!row.dateOfExpiry) rowErrors.push(`Row ${i + 1}: Date of expiry is required`);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Normalize sex
        let sex = row.sex;
        if (sex === 'M') sex = 'Male';
        if (sex === 'F') sex = 'Female';
        
        // Only include columns that exist in passports table
        validRows.push({
          passport_number: row.passportNo.toUpperCase(),
          surname: row.surname,
          given_name: row.givenName,
          nationality: row.nationality,
          date_of_birth: row.dob,
          sex: sex,
          date_of_expiry: row.dateOfExpiry,
          created_by: user.id,
          // Optional fields removed as they don't exist in new schema:
          // place_of_birth, place_of_issue, date_of_issue, file_number, email, phone
        });
      }
    }

    // Insert valid passports
    const inserted = [];
    const insertErrors = [];
    
    if (validRows.length > 0) {
      console.log('Inserting valid rows:', validRows.length);
      
      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}, records:`, batch.length);
        console.log('Sample record:', batch[0]);
        
        const { data: batchData, error: batchError } = await supabase
          .from('passports')
          .insert(batch)
          .select('id, passport_number, surname, given_name');

        if (batchError) {
          console.error('Insert error details:', {
            message: batchError.message,
            details: batchError.details,
            hint: batchError.hint,
            code: batchError.code
          });
          
          if (batchError.message && /duplicate/i.test(batchError.message)) {
            insertErrors.push(`Some passport numbers already exist in the database`);
          } else if (batchError.message && /permission/i.test(batchError.message)) {
            insertErrors.push(`Permission denied - check RLS policies or authentication`);
          } else {
            insertErrors.push(`Database error: ${batchError.message}`);
          }
        } else if (batchData) {
          console.log('Batch inserted successfully:', batchData.length);
          inserted.push(...batchData);
        }
      }
    } else {
      console.log('No valid rows to insert');
    }

    // Create upload log
    console.log('Creating upload log entry...');
    const batchId = `BULK_${Date.now()}_${user.id.substring(0, 8)}`;
    const { error: logError } = await supabase
      .from('bulk_uploads')
      .insert({
        batch_id: batchId,
        file_name: file.name,
        total_records: rows.length,
        successful_records: inserted.length,
        failed_records: errors.length + insertErrors.length,
        created_by: user.id,
        status: inserted.length > 0 ? 'completed' : 'failed',
        error_log: errors.length + insertErrors.length > 0 ? [...errors, ...insertErrors] : null,
        completed_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Failed to create upload log:', logError);
      console.error('Log error details:', {
        message: logError.message,
        details: logError.details,
        hint: logError.hint
      });
    } else {
      console.log('Upload log created successfully');
    }

    return {
      success: inserted.length > 0,
      passports: inserted,
      errors: [...errors, ...insertErrors],
      totalProcessed: rows.length,
      successCount: inserted.length,
      errorCount: errors.length + insertErrors.length,
      message: `Successfully processed ${inserted.length} out of ${rows.length} passports`
    };

  } catch (error) {
    console.error('Bulk upload error:', error);
    throw error;
  }
}

/**
 * Get recent bulk upload history
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>}
 */
export async function getBulkUploadHistory(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('bulk_uploads')
      .select(`
        *,
        uploader:created_by(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching upload history:', error);
      // Return empty array if table doesn't exist or error
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching upload history:', error);
    return [];
  }
}

/**
 * Get passports from a specific bulk upload
 * @param {string} uploadId - Bulk upload ID
 * @returns {Promise<Array>}
 */
export async function getPassportsFromUpload(uploadId) {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('bulk_upload_id', uploadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upload passports:', error);
    throw error;
  }
}

/**
 * Download sample Excel template
 * @param {Array} fields - Array of field configurations
 * @returns {Blob}
 */
export function generateExcelTemplate(fields) {
  // This will be handled by the frontend component
  // using the existing CSV generation logic
  return null;
}

/**
 * Validate passport data before upload
 * @param {Object} passportData
 * @returns {{valid: boolean, errors: Array}}
 */
export function validatePassportData(passportData) {
  const errors = [];

  if (!passportData.passportNo || passportData.passportNo.trim().length < 5) {
    errors.push('Passport number is required and must be at least 5 characters');
  }
  
  if (!passportData.surname || passportData.surname.trim().length === 0) {
    errors.push('Surname is required');
  }
  
  if (!passportData.givenName || passportData.givenName.trim().length === 0) {
    errors.push('Given name is required');
  }
  
  if (!passportData.nationality || passportData.nationality.trim().length === 0) {
    errors.push('Nationality is required');
  }
  
  if (!passportData.dob) {
    errors.push('Date of birth is required');
  }
  
  if (!passportData.sex || !['Male', 'Female', 'Other', 'M', 'F'].includes(passportData.sex)) {
    errors.push('Sex must be Male, Female, or Other');
  }
  
  if (!passportData.dateOfExpiry) {
    errors.push('Passport expiry date is required');
  }

  // Validate date formats
  if (passportData.dob && isNaN(Date.parse(passportData.dob))) {
    errors.push('Date of birth must be a valid date');
  }
  
  if (passportData.dateOfExpiry && isNaN(Date.parse(passportData.dateOfExpiry))) {
    errors.push('Expiry date must be a valid date');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}


