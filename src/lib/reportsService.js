
export const getRevenueReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('revenue_report')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading revenue report:', error);
    return [];
  }
};

export const getPassportReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading passport report:', error);
    return [];
  }
};

export const getIndividualPurchaseReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('individual_purchases')
      .select(`
        *,
        passport:passports(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading individual purchase report:', error);
    return [];
  }
};

export const getCorporateVoucherReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .select(`
        *,
        passport:passports(*)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading corporate voucher report:', error);
    return [];
  }
};

export const getBulkUploadReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('bulk_uploads')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading bulk upload report:', error);
    return [];
  }
};

export const getQuotationReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading quotation report:', error);
    return [];
  }
};

export const getTransactionReport = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading transaction report:', error);
    return [];
  }
};

export const getDashboardStats = async () => {
  try {
    // Get counts for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // TODO: Migrate to PostgreSQL API endpoints for counts
    const [passports, individual, corporate, quotations] = await Promise.all([
      Promise.resolve({ count: 0 }), // supabase.from('passports').select('id', { count: 'exact', head: true }),
      Promise.resolve({ count: 0 }), // supabase.from('individual_purchases').select('id', { count: 'exact', head: true }),
      Promise.resolve({ count: 0 }), // supabase.from('corporate_vouchers').select('id', { count: 'exact', head: true }),
      Promise.resolve({ count: 0 }), // supabase.from('quotations').select('id', { count: 'exact', head: true }),
    ]);

    // Get revenue for today
    const { data: todayRevenue } = await supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', today.toISOString());

    const totalRevenue = todayRevenue?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    return {
      totalPassports: passports.count || 0,
      totalIndividualPurchases: individual.count || 0,
      totalCorporateVouchers: corporate.count || 0,
      totalQuotations: quotations.count || 0,
      todayRevenue: totalRevenue,
    };
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return {
      totalPassports: 0,
      totalIndividualPurchases: 0,
      totalCorporateVouchers: 0,
      totalQuotations: 0,
      todayRevenue: 0,
    };
  }
};
