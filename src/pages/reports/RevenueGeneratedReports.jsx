import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';
import { supabase } from '@/lib/supabaseClient';

const columns = [
  { name: 'Type', selector: row => row.type, sortable: true },
  { name: 'Total Exit Pass', selector: row => row.totalExitPass, sortable: true, right: true },
  { name: 'Exit Pass Value', selector: row => row.exitPassValue, sortable: true, right: true },
  { name: 'Total Amount', selector: row => row.totalAmount, sortable: true, right: true },
  { name: 'Discount', selector: row => row.discount, sortable: true, right: true },
  { name: 'Amount After Discount', selector: row => row.amountAfterDiscount, sortable: true, right: true },
  { name: 'Collected Amount', selector: row => row.collectedAmount, sortable: true, right: true },
  { name: 'Returned Amount', selector: row => row.returnedAmount, sortable: true, right: true },
  { name: 'Payment Mode', selector: row => row.paymentMode, sortable: true },
  { name: 'Payment Date', selector: row => row.paymentDate, sortable: true },
];

const customStyles = {
  header: { style: { minHeight: '56px' } },
  headRow: { style: { borderTopStyle: 'solid', borderTopWidth: '1px', borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' } },
  headCells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' }, color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' } },
  cells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' } } },
};

const StatCard = ({ title, value }) => (
  <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

const RevenueGeneratedReports = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalExitPass: 0,
    totalAmount: 0,
    totalCollected: 0,
    totalDiscount: 0,
    totalReturned: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRevenueData();
  }, [dateFrom, dateTo]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch individual purchases
      let individualQuery = supabase
        .from('individual_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) individualQuery = individualQuery.gte('created_at', dateFrom);
      if (dateTo) individualQuery = individualQuery.lte('created_at', dateTo);

      const { data: individualData, error: individualError } = await individualQuery;
      if (individualError) throw individualError;

      // Fetch corporate vouchers
      let corporateQuery = supabase
        .from('corporate_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) corporateQuery = corporateQuery.gte('created_at', dateFrom);
      if (dateTo) corporateQuery = corporateQuery.lte('created_at', dateTo);

      const { data: corporateData, error: corporateError } = await corporateQuery;
      if (corporateError) throw corporateError;

      // Transform individual purchases
      const individualRows = (individualData || []).map(item => {
        const discount = item.discount || 0;
        const totalAmount = item.amount || 0;
        const amountAfterDiscount = totalAmount - discount;
        const collectedAmount = item.collected_amount || totalAmount;
        const returnedAmount = item.returned_amount || 0;

        return {
          id: `ind-${item.id}`,
          type: 'Individual',
          totalExitPass: 1,
          exitPassValue: totalAmount,
          totalAmount: totalAmount,
          discount: discount,
          amountAfterDiscount: amountAfterDiscount,
          collectedAmount: collectedAmount,
          returnedAmount: returnedAmount,
          paymentMode: item.payment_method || 'N/A',
          paymentDate: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : 'N/A'
        };
      });

      // Transform corporate vouchers (group by company/batch)
      const corporateGroups = {};
      (corporateData || []).forEach(voucher => {
        const key = `${voucher.company_name}-${voucher.created_at.split('T')[0]}`;
        if (!corporateGroups[key]) {
          corporateGroups[key] = {
            id: `corp-${key}`,
            type: 'Corporate',
            totalExitPass: 0,
            exitPassValue: voucher.amount || 0,
            totalAmount: 0,
            discount: 0,
            amountAfterDiscount: 0,
            collectedAmount: 0,
            returnedAmount: 0,
            paymentMode: voucher.payment_method || 'N/A',
            paymentDate: voucher.created_at ? new Date(voucher.created_at).toISOString().split('T')[0] : 'N/A',
            companyName: voucher.company_name
          };
        }
        const voucherAmount = voucher.amount || 0;
        const voucherDiscount = voucher.discount || 0;
        const voucherCollected = voucher.collected_amount || voucherAmount;
        const voucherReturned = voucher.returned_amount || 0;

        corporateGroups[key].totalExitPass += voucher.quantity || 1;
        corporateGroups[key].totalAmount += voucherAmount;
        corporateGroups[key].discount += voucherDiscount;
        corporateGroups[key].amountAfterDiscount += (voucherAmount - voucherDiscount);
        corporateGroups[key].collectedAmount += voucherCollected;
        corporateGroups[key].returnedAmount += voucherReturned;
      });

      const corporateRows = Object.values(corporateGroups);
      const allData = [...individualRows, ...corporateRows];
      setData(allData);

      // Calculate statistics
      const totalRecords = allData.length;
      const totalExitPass = allData.reduce((sum, row) => sum + row.totalExitPass, 0);
      const totalAmount = allData.reduce((sum, row) => sum + row.totalAmount, 0);
      const totalCollected = allData.reduce((sum, row) => sum + row.collectedAmount, 0);
      const totalDiscount = allData.reduce((sum, row) => sum + row.discount, 0);
      const totalReturned = allData.reduce((sum, row) => sum + row.returnedAmount, 0);

      setStats({
        totalRecords,
        totalExitPass,
        totalAmount,
        totalCollected,
        totalDiscount,
        totalReturned
      });

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError(error.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredData = data.filter(row => {
    return !typeFilter || row.type.toLowerCase().includes(typeFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Revenue Generated Reports
        </h1>
        <ExportButton
          data={filteredData}
          columns={columns}
          filename="Revenue_Report"
          title="Revenue Generated Report"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading revenue data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchRevenueData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Records" value={stats.totalRecords} />
        <StatCard title="Total Exit Pass" value={stats.totalExitPass} />
        <StatCard title="Total Amount" value={`PGK ${stats.totalAmount.toFixed(2)}`} />
        <StatCard title="Total Collected" value={`PGK ${stats.totalCollected.toFixed(2)}`} />
        <StatCard title="Total Discount" value={`PGK ${stats.totalDiscount.toFixed(2)}`} />
        <StatCard title="Total Returned" value={`PGK ${stats.totalReturned.toFixed(2)}`} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input 
            placeholder="Filter by Type..." 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Input 
            type="date" 
            placeholder="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input 
            type="date" 
            placeholder="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
          progressComponent={<div className="py-8">Loading revenue data...</div>}
          noDataComponent={<div className="py-8 text-slate-500">No revenue data found</div>}
        />
      </div>
    </div>
  );
};

export default RevenueGeneratedReports;