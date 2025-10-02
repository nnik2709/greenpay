import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const data = [
  { id: 1, exitPassNo: 'EP12345', passportNo: 'PA123456', nationality: 'PNG', total: 100, discount: 10, totalAfterDiscount: 90, collectedAmount: 90, paymentMethod: 'CASH', paymentDate: '2025-10-01 10:00', used: true },
  { id: 2, exitPassNo: 'EP12346', passportNo: 'PB654321', nationality: 'AUS', total: 100, discount: 0, totalAfterDiscount: 100, collectedAmount: 100, paymentMethod: 'CREDIT CARD', paymentDate: '2025-10-01 11:30', used: false },
];

const columns = [
  { name: 'Exit Pass Number', selector: row => row.exitPassNo, sortable: true },
  { name: 'Passport No', selector: row => row.passportNo, sortable: true },
  { name: 'Nationality', selector: row => row.nationality, sortable: true },
  { name: 'Total', selector: row => row.total, sortable: true, right: true },
  { name: 'Discount', selector: row => row.discount, sortable: true, right: true },
  { name: 'Total After Discount', selector: row => row.totalAfterDiscount, sortable: true, right: true },
  { name: 'Collected Amount', selector: row => row.collectedAmount, sortable: true, right: true },
  { name: 'Payment Method', selector: row => row.paymentMethod, sortable: true },
  { name: 'Payment Date', selector: row => row.paymentDate, sortable: true },
  { name: 'Used', selector: row => (row.used ? 'Yes' : 'No'), sortable: true },
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

const IndividualPurchaseReports = () => {
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
          Individual Purchase Reports
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
        <StatCard title="Total Amount" value="$200.00" />
        <StatCard title="Total Collected" value="$190.00" />
        <StatCard title="Total Discount" value="$10.00" />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input placeholder="Filter by Passport No..." />
          <Input placeholder="Filter by Nationality..." />
          <Input placeholder="Filter by Payment Method..." />
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

export default IndividualPurchaseReports;