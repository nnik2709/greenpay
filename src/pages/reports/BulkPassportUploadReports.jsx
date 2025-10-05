import React from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';

const data = [
  { id: 1, date: '2025-09-15 14:00', fileName: 'passports_sept.xlsx', uploadedBy: 'admin@png.gov', records: 100, vouchers: 100, voucherValue: 100, paymentMode: 'CREDIT CARD', totalAmount: 10000, discount: 0, collected: 10000, paymentCode: 'PAY123' },
  { id: 2, date: '2025-09-18 10:30', fileName: 'tour_group_A.csv', uploadedBy: 'agent@png.gov', records: 50, vouchers: 50, voucherValue: 100, paymentMode: 'BANK TRANSFER', totalAmount: 5000, discount: 10, collected: 4500, paymentCode: 'PAY124' },
];

const columns = [
  { name: 'Date', selector: row => row.date, sortable: true },
  { name: 'File Name', selector: row => row.fileName, sortable: true },
  { name: 'Uploaded By', selector: row => row.uploadedBy, sortable: true },
  { name: 'Records', selector: row => row.records, sortable: true, right: true },
  { name: 'Vouchers', selector: row => row.vouchers, sortable: true, right: true },
  { name: 'Voucher Value', selector: row => row.voucherValue, sortable: true, right: true },
  { name: 'Payment Mode', selector: row => row.paymentMode, sortable: true },
  { name: 'Total Amount', selector: row => row.totalAmount, sortable: true, right: true },
  { name: 'Discount (%)', selector: row => row.discount, sortable: true, right: true },
  { name: 'Collected', selector: row => row.collected, sortable: true, right: true },
  { name: 'Payment Code', selector: row => row.paymentCode, sortable: true },
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

const BulkPassportUploadReports = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Bulk Passport Upload Reports
        </h1>
        <ExportButton
          data={data}
          columns={columns}
          filename="Bulk_Upload_Report"
          title="Bulk Passport Upload Report"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Uploads" value="2" />
        <StatCard title="Total Passports" value="150" />
        <StatCard title="Total Revenue" value="$14,500" />
        <StatCard title="Avg. Amount/Upload" value="$7,250" />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Filter by File Name..." />
          <Input placeholder="Filter by Uploaded By..." />
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

export default BulkPassportUploadReports;