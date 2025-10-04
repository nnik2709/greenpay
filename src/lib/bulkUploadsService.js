import { supabase } from './supabaseClient';
import { createPassport } from './passportsService';

const generateBatchId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
};

export const getBulkUploads = async () => {
  try {
    const { data, error } = await supabase
      .from('bulk_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading bulk uploads:', error);
    return [];
  }
};

export const processBulkUpload = async (records, fileName, userId) => {
  const batchId = generateBatchId();
  const totalRecords = records.length;
  let successfulRecords = 0;
  let failedRecords = 0;
  const errorLog = [];

  try {
    // Create bulk upload record
    const { data: bulkUpload, error: bulkError } = await supabase
      .from('bulk_uploads')
      .insert([{
        batch_id: batchId,
        file_name: fileName,
        total_records: totalRecords,
        status: 'processing',
        created_by: userId,
      }])
      .select()
      .single();

    if (bulkError) throw bulkError;

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        await createPassport({
          passportNumber: record.passportNumber,
          nationality: record.nationality,
          surname: record.surname,
          givenName: record.givenName,
          dob: record.dob,
          sex: record.sex,
          dateOfExpiry: record.dateOfExpiry,
        }, userId);
        successfulRecords++;
      } catch (error) {
        failedRecords++;
        errorLog.push({
          row: i + 1,
          passportNumber: record.passportNumber,
          error: error.message,
        });
      }
    }

    // Update bulk upload record with results
    await supabase
      .from('bulk_uploads')
      .update({
        successful_records: successfulRecords,
        failed_records: failedRecords,
        status: failedRecords === totalRecords ? 'failed' : 'completed',
        error_log: errorLog,
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkUpload.id);

    return {
      batchId,
      totalRecords,
      successfulRecords,
      failedRecords,
      errorLog,
    };
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    throw error;
  }
};

export const getBulkUploadById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('bulk_uploads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading bulk upload:', error);
    return null;
  }
};
