import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';

const data = [
  { id: 1, type: 'Individual', totalExitPass: 1, exitPassValue: 100, totalAmount: 100, discount: 10, amountAfterDiscount: 90, collectedAmount: 90, returnedAmount: 0, paymentMode: 'CASH', paymentDate: '2025-10-01' },
  { id: 2, type: 'Corporate', totalExitPass: 50, exitPassValue: 100, totalAmount: 5000, discount: 500, amountAfterDiscount: 4500, collectedAmount: 4500, returnedAmount: 0, paymentMode: 'BANK TRANSFER', paymentDate: '2025-09-20' },
  { id: 3, type: 'Bulk Upload', totalExitPass: 100, exitPassValue: 100, totalAmount: 10000, discount: 0, amountAfterDiscount: 10000, collectedAmount: 10000, returnedAmount: 0, paymentMode: 'CREDIT CARD', paymentDate: '2025-09-15' },
];

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Revenue Generated Reports
        </h1>
        <ExportButton
          data={data}
          columns={columns}
          filename="Revenue_Report"
          title="Revenue Generated Report"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Records" value="3" />
        <StatCard title="Total Exit Pass" value="151" />
        <StatCard title="Total Amount" value="$15,100" />
        <StatCard title="Total Collected" value="$14,590" />
        <StatCard title="Total Discount" value="$510" />
        <StatCard title="Total Returned" value="$0" />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Filter by Type..." />
          <Input type="date" placeholder="Date From" />
          <Input type="date" placeholder="Date To" />
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

export default RevenueGeneratedReports;