import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataTable from 'react-data-table-component';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api/client';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const columns = [
  { name: 'Type', selector: row => row.type, sortable: true },
  { name: 'Nationality', selector: row => row.nationality, sortable: true },
  { name: 'Passport No', selector: row => row.passportNo, sortable: true },
  { name: 'Surname', selector: row => row.surname, sortable: true },
  { name: 'Given Name', selector: row => row.givenName, sortable: true },
  { name: 'Date of Expiry', selector: row => row.dateOfExpiry, sortable: true },
];

const customStyles = {
  header: { style: { minHeight: '56px' } },
  headRow: { style: { borderTopStyle: 'solid', borderTopWidth: '1px', borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' } },
  headCells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' }, color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' } },
  cells: { style: { '&:not(:last-of-type)': { borderRightStyle: 'solid', borderRightWidth: '1px', borderRightColor: '#E2E8F0' } } },
};

const PassportReports = () => {
  const { toast } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPassports();
  }, [page]);

  const fetchPassports = async (pageNum = page) => {
    try {
      setLoading(true);

      // Build query params with pagination and search
      const params = {
        page: pageNum,
        limit,
        search: searchQuery
      };
      if (fromDate) params.dateFrom = fromDate;
      if (toDate) params.dateTo = toDate;

      const response = await api.get('/passports', { params });
      const passports = response.data || [];

      // Transform data to match table format
      const transformedData = passports.map(p => {
        // Parse full_name into surname and given name if needed
        let surname = p.surname || '';
        let givenName = p.given_name || p.givenName || '';

        // If we have full_name but not separate fields, parse it
        if (!surname && !givenName && p.full_name) {
          const parts = p.full_name.trim().split(' ');
          if (parts.length > 1) {
            surname = parts[parts.length - 1]; // Last word as surname
            givenName = parts.slice(0, -1).join(' '); // Rest as given name
          } else {
            surname = p.full_name; // Single name goes to surname
          }
        }

        // Format dates
        const dob = p.date_of_birth
          ? new Date(p.date_of_birth).toLocaleDateString()
          : (p.dob || '');

        const dateOfExpiry = p.expiry_date
          ? new Date(p.expiry_date).toLocaleDateString()
          : (p.date_of_expiry ? new Date(p.date_of_expiry).toLocaleDateString() : (p.dateOfExpiry || ''));

        return {
          id: p.id,
          type: p.passport_type || 'P',
          nationality: p.nationality || '',
          passportNo: p.passport_number || p.passportNo || '',
          surname,
          givenName,
          dob,
          sex: p.sex || '',
          dateOfExpiry,
        };
      });

      setData(transformedData);

      // Handle pagination metadata
      if (response.pagination) {
        setPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching passports:', error);
      alert('Failed to load passports');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to page 1 when searching
    fetchPassports(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const handleExportCsv = async () => {
    try {
      // Export all data (fetch without pagination)
      const params = {
        limit: 10000, // Large number to get all records
        search: searchQuery
      };
      if (fromDate) params.dateFrom = fromDate;
      if (toDate) params.dateTo = toDate;

      const response = await api.get('/passports', { params });
      const passports = response.data || [];

      if (passports.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Data',
          description: 'No passports to export'
        });
        return;
      }

      // Transform data for CSV
      const csvData = passports.map(p => {
        let surname = p.surname || '';
        let givenName = p.given_name || p.givenName || '';

        if (!surname && !givenName && p.full_name) {
          const parts = p.full_name.trim().split(' ');
          if (parts.length > 1) {
            surname = parts[parts.length - 1];
            givenName = parts.slice(0, -1).join(' ');
          } else {
            surname = p.full_name;
          }
        }

        return {
          'Type': p.passport_type || 'P',
          'Nationality': p.nationality || '',
          'Passport No': p.passport_number || '',
          'Surname': surname,
          'Given Name': givenName,
          'Date of Expiry': p.expiry_date ? formatDate(p.expiry_date) : '',
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(csvData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Passports');

      // Generate file
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `passports_report_${dateStr}.xlsx`);

      toast({
        title: 'Export Successful',
        description: `Exported ${passports.length} passport records`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message || 'Failed to export data'
      });
    }
  };

  const handleExportPdf = async () => {
    try {
      // Export all data (fetch without pagination)
      const params = {
        limit: 10000, // Large number to get all records
        search: searchQuery
      };
      if (fromDate) params.dateFrom = fromDate;
      if (toDate) params.dateTo = toDate;

      const response = await api.get('/passports', { params });
      const passports = response.data || [];

      if (passports.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Data',
          description: 'No passports to export'
        });
        return;
      }

      // Create PDF
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns

      // Add title
      doc.setFontSize(16);
      doc.text('Passport Report', 14, 15);

      // Add date range if applicable
      if (fromDate || toDate) {
        doc.setFontSize(10);
        const dateRange = `${fromDate || 'Start'} to ${toDate || 'End'}`;
        doc.text(dateRange, 14, 22);
      }

      // Prepare table data
      const tableData = passports.map(p => {
        let surname = p.surname || '';
        let givenName = p.given_name || p.givenName || '';

        if (!surname && !givenName && p.full_name) {
          const parts = p.full_name.trim().split(' ');
          if (parts.length > 1) {
            surname = parts[parts.length - 1];
            givenName = parts.slice(0, -1).join(' ');
          } else {
            surname = p.full_name;
          }
        }

        return [
          p.passport_type || 'P',
          p.nationality || '',
          p.passport_number || '',
          surname,
          givenName,
          p.expiry_date ? formatDate(p.expiry_date) : '',
        ];
      });

      // Add table
      autoTable(doc, {
        head: [['Type', 'Nationality', 'Passport No', 'Surname', 'Given Name', 'Expiry Date']],
        body: tableData,
        startY: fromDate || toDate ? 28 : 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [5, 150, 105] },
      });

      // Save PDF
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`passports_report_${dateStr}.pdf`);

      toast({
        title: 'PDF Downloaded',
        description: `Exported ${passports.length} passport records`
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message || 'Failed to generate PDF'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Passports Report
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2"
            variant="outline"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by passport number, full name, or nationality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Input type="date" placeholder="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" placeholder="To" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination={false}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
          progressComponent={<div className="py-8">Loading passports...</div>}
          noDataComponent={<div className="py-8 text-slate-500">No passports found</div>}
        />

        {/* Custom Backend Pagination Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {data.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPassports(1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => fetchPassports(page - 1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => fetchPassports(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => fetchPassports(totalPages)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportReports;
