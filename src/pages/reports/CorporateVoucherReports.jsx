import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import VoucherPrint from '@/components/VoucherPrint';
import ExportButton from '@/components/ExportButton';

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

const CorporateVoucherReports = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data: vouchers, error } = await supabase
        .from('corporate_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(vouchers || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: "Error",
        description: "Failed to load vouchers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowPrint(true);
  };

  const columns = [
    { name: 'Voucher Code', selector: row => row.voucher_code, sortable: true, width: '150px' },
    { name: 'Company', selector: row => row.company_name, sortable: true },
    { name: 'Passport No', selector: row => row.passport_number, sortable: true },
    { name: 'Quantity', selector: row => row.quantity, sortable: true, right: true },
    { name: 'Amount', selector: row => `PGK ${row.amount}`, sortable: true, right: true },
    { name: 'Payment Method', selector: row => row.payment_method, sortable: true },
    { name: 'Created', selector: row => new Date(row.created_at).toLocaleDateString(), sortable: true },
    { name: 'Valid Until', selector: row => new Date(row.valid_until).toLocaleDateString(), sortable: true },
    { name: 'Status', selector: row => row.used_at ? 'Used' : 'Valid', sortable: true, cell: row => (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.used_at ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
        {row.used_at ? 'Used' : 'Valid'}
      </span>
    )},
    {
      name: 'Actions',
      cell: row => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePrintVoucher(row)}
          disabled={row.used_at !== null}
          title={row.used_at ? 'Cannot print used voucher' : 'Print voucher'}
        >
          Print
        </Button>
      ),
      width: '100px'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Corporate Voucher Reports
        </h1>
        <ExportButton
          data={data}
          columns={columns}
          filename="Corporate_Voucher_Report"
          title="Corporate Voucher Report"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={data.length} />
        <StatCard title="Total Quantity" value={data.reduce((sum, v) => sum + (v.quantity || 0), 0)} />
        <StatCard title="Total Amount" value={`PGK ${data.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0).toFixed(2)}`} />
        <StatCard title="Valid Vouchers" value={data.filter(v => !v.used_at).length} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Filter by Company..." />
          <Input placeholder="Filter by Payment Mode..." />
          <Input type="date" placeholder="Date From" />
        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
        />
      </div>

      <VoucherPrint
        voucher={selectedVoucher}
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        voucherType="Corporate"
      />
    </div>
  );
};

export default CorporateVoucherReports;
