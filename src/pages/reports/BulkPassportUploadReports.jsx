import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import ExportButton from '@/components/ExportButton';
import { getBulkUploadHistory } from '@/lib/bulkUploadService';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchBulkUploads();
  }, []);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const fetchBulkUploads = async () => {
    try {
      setLoading(true);
      const uploads = await getBulkUploadHistory(100);
      
      // Transform the data to match the columns
      const transformedData = uploads.map(upload => ({
        id: upload.batch_id || upload.id,
        date: new Date(upload.created_at).toLocaleString(),
        fileName: upload.file_name || 'N/A',
        uploadedBy: upload.uploader?.email || upload.uploader?.full_name || 'N/A',
        records: upload.total_records || 0,
        vouchers: upload.successful_records || 0,
        voucherValue: 100, // Default value per voucher
        paymentMode: 'N/A', // Not tracked in bulk_uploads table
        totalAmount: (upload.successful_records || 0) * 100, // Calculate from vouchers
        discount: 0, // Not tracked
        collected: (upload.successful_records || 0) * 100,
        paymentCode: upload.batch_id || 'N/A'
      }));
      
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching bulk uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load bulk upload reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPassports = data.reduce((sum, item) => sum + item.records, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const avgAmountPerUpload = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Bulk Passport Upload Reports
        </h1>
        <ExportButton
          data={filteredData}
          columns={columns}
          filename="Bulk_Upload_Report"
          title="Bulk Passport Upload Report"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Uploads" value={data.length} />
        <StatCard title="Total Passports" value={totalPassports} />
        <StatCard title="Total Revenue" value={`PGK ${totalRevenue.toFixed(2)}`} />
        <StatCard title="Avg. Amount/Upload" value={`PGK ${avgAmountPerUpload}`} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Filter by File Name..." />
          <Input placeholder="Filter by Uploaded By..." />
          <Input type="date" placeholder="Date From" />
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

export default BulkPassportUploadReports;