import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const data = [
  { id: 1, fileNo: 101, totalExitPass: 50, exitPassValues: 100, total: 5000, discount: 500, totalAfterDiscount: 4500, collectedAmount: 4500, returnedAmount: 0, paymentMethod: 'BANK TRANSFER', createdAt: '2025-09-20', validTill: '2026-09-20' },
  { id: 2, fileNo: 102, totalExitPass: 20, exitPassValues: 100, total: 2000, discount: 0, totalAfterDiscount: 2000, collectedAmount: 2000, returnedAmount: 0, paymentMethod: 'CASH', createdAt: '2025-09-25', validTill: '2026-09-25' },
];

const columns = [
  { name: 'File No', selector: row => row.fileNo, sortable: true },
  { name: 'Total Exit Pass', selector: row => row.totalExitPass, sortable: true, right: true },
  { name: 'Exit Pass Values', selector: row => row.exitPassValues, sortable: true, right: true },
  { name: 'Total', selector: row => row.total, sortable: true, right: true },
  { name: 'Discount', selector: row => row.discount, sortable: true, right: true },
  { name: 'Total After Discount', selector: row => row.totalAfterDiscount, sortable: true, right: true },
  { name: 'Collected Amount', selector: row => row.collectedAmount, sortable: true, right: true },
  { name: 'Returned Amount', selector: row => row.returnedAmount, sortable: true, right: true },
  { name: 'Payment Method', selector: row => row.paymentMethod, sortable: true },
  { name: 'Created At', selector: row => row.createdAt, sortable: true },
  { name: 'Valid Till', selector: row => row.validTill, sortable: true },
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

const CorporateVoucherReports = () => {
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
          Corporate Voucher Reports
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Records" value="2" />
        <StatCard title="Total Exit Pass" value="70" />
        <StatCard title="Total Amount" value="$7,000" />
        <StatCard title="Total Collected" value="$6,500" />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Filter by File No..." />
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
        />
      </div>
    </motion.div>
  );
};

export default CorporateVoucherReports;