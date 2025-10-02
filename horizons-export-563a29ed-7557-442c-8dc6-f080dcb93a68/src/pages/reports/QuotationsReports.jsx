import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const data = [
  { id: 1, quotation: 'QUO-001', sentAt: '2025-09-01', customer: 'Corporate Inc.', expiryDate: '2025-10-01', notes: 'Bulk discount applied', price: 10000, status: 'Sent' },
  { id: 2, quotation: 'QUO-002', sentAt: '2025-09-05', customer: 'Travel Agency LLC', expiryDate: '2025-10-05', notes: 'Standard pricing', price: 5000, status: 'Approved' },
  { id: 3, quotation: 'QUO-003', sentAt: '2025-09-10', customer: 'Global Tours', expiryDate: '2025-10-10', notes: '', price: 20000, status: 'Converted' },
];

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

  const handleAction = (action) => {
    toast({
      title: "🚧 Feature In Progress!",
      description: `${action} isn't implemented yet. You can request it in your next prompt! 🚀`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Quotations Reports
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleAction('Copy')}>
            <Copy className="w-4 h-4 mr-2" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAction('Excel Export')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAction('CSV Export')}>
            <FileText className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAction('PDF Export')}>
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total" value="3" />
        <StatCard title="Draft" value="0" />
        <StatCard title="Sent" value="1" />
        <StatCard title="Approved" value="1" />
        <StatCard title="Converted" value="1" />
        <StatCard title="Amount Sum" value="$35,000" />
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
          data={data}
          pagination
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
        />
      </div>
    </motion.div>
  );
};

export default QuotationsReports;