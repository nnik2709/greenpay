import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const columns = [
  { name: 'Quotation', selector: row => row.quotation, sortable: true },
  { name: 'Sent At', selector: row => row.sentAt, sortable: true },
  { name: 'Customer', selector: row => row.customer, sortable: true },
  { name: 'Expiry Date', selector: row => row.expiryDate, sortable: true },
  { name: 'Notes', selector: row => row.notes, sortable: true },
  { name: 'Price', selector: row => row.price, sortable: true, right: true },
  { name: 'Status', selector: row => row.status, sortable: true },
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

const QuotationsReports = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const { data: quotations, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match the columns
      const transformedData = (quotations || []).map(q => ({
        id: q.id,
        quotation: q.quotation_number || `QUO-${q.id}`,
        sentAt: q.sent_at ? new Date(q.sent_at).toLocaleDateString() : 'Not sent',
        customer: q.customer_name || q.company_name || 'N/A',
        expiryDate: q.expiry_date ? new Date(q.expiry_date).toLocaleDateString() : 'N/A',
        notes: q.notes || '',
        price: q.total_amount || q.price || 0,
        status: q.status || 'Draft'
      }));
      
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const countByStatus = (status) => data.filter(q => q.status.toLowerCase() === status.toLowerCase()).length;
  const totalAmount = data.reduce((sum, q) => sum + (parseFloat(q.price) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Quotations Reports
        </h1>
        <ExportButton
          data={filteredData}
          columns={columns}
          filename="Quotations_Report"
          title="Quotations Report"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total" value={data.length} />
        <StatCard title="Draft" value={countByStatus('Draft')} />
        <StatCard title="Sent" value={countByStatus('Sent')} />
        <StatCard title="Approved" value={countByStatus('Approved')} />
        <StatCard title="Converted" value={countByStatus('Converted')} />
        <StatCard title="Amount Sum" value={`PGK ${totalAmount.toFixed(2)}`} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input placeholder="Filter by Status..." />
          <Input type="date" placeholder="Start Date" />
          <Input type="date" placeholder="End Date" />
          <Input placeholder="Filter by Creator..." />
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
        />
      </div>
    </div>
  );
};

export default QuotationsReports;