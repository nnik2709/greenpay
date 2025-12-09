
/**
 * Corporate ZIP Download Service
 * Handles generation and download of corporate voucher ZIP files
 */

/**
 * Generate and download ZIP file for corporate vouchers
 * @param {Object} options - { company_name?, batch_date?, voucher_ids? }
 * @returns {Promise<{success: boolean, zipUrl?: string, fileName?: string, error?: string}>}
 */
export async function generateCorporateZip(options) {
  const { company_name, batch_date, voucher_ids } = options;

  if (!company_name && !batch_date && !voucher_ids) {
    throw new Error('Please provide either company_name and batch_date, or voucher_ids');
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-corporate-zip', {
      body: {
        company_name,
        batch_date,
        voucher_ids
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate ZIP file');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to generate ZIP file');
    }

    return {
      success: true,
      zipUrl: data.zipUrl,
      fileName: data.fileName,
      voucherCount: data.voucherCount,
      totalAmount: data.totalAmount,
      company: data.company,
      vouchers: data.vouchers
    };

  } catch (error) {
    console.error('Error generating corporate ZIP:', error);
    throw error;
  }
}

/**
 * Download ZIP file directly to user's computer
 * @param {string} zipUrl - URL of the ZIP file
 * @param {string} fileName - Name for the downloaded file
 */
export async function downloadZipFile(zipUrl, fileName) {
  try {
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error('Failed to download ZIP file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'corporate_vouchers.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading ZIP:', error);
    throw error;
  }
}

/**
 * Get corporate vouchers for a specific batch
 * @param {string} companyName
 * @param {string} batchDate - ISO date string
 * @returns {Promise<Array>}
 */
export async function getCorporateVoucherBatch(companyName, batchDate) {
  try {
    const startDate = new Date(batchDate);
    const endDate = new Date(batchDate);
    endDate.setDate(endDate.getDate() + 1);

    let query = supabase
      .from('corporate_vouchers')
      .select('*')
      .order('created_at', { ascending: true });

    if (companyName) {
      query = query.eq('company_name', companyName);
    }

    query = query
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching corporate batch:', error);
    throw error;
  }
}

/**
 * Get all batches grouped by company and date
 * @returns {Promise<Array>}
 */
export async function getCorporateBatches() {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .select('company_name, created_at, amount, quantity')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by company and date
    const batches = {};
    (data || []).forEach(voucher => {
      const date = voucher.created_at.split('T')[0];
      const key = `${voucher.company_name}-${date}`;
      
      if (!batches[key]) {
        batches[key] = {
          company_name: voucher.company_name,
          batch_date: date,
          voucher_count: 0,
          total_quantity: 0,
          total_amount: 0,
        };
      }
      
      batches[key].voucher_count += 1;
      batches[key].total_quantity += voucher.quantity || 1;
      batches[key].total_amount += voucher.amount || 0;
    });

    return Object.values(batches);
  } catch (error) {
    console.error('Error fetching corporate batches:', error);
    throw error;
  }
}









