import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Printer, FileEdit, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api/client';
import * as XLSX from 'xlsx';
import VoucherPrint from '@/components/VoucherPrint';

const VouchersList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, individual, corporate
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, used, expired
  const [printVoucher, setPrintVoucher] = useState(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Format date as dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 100 });

  useEffect(() => {
    loadVouchers();
  }, [currentPage]);

  useEffect(() => {
    filterVouchers();
  }, [searchQuery, vouchers, typeFilter, statusFilter]);

  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      // Load individual vouchers with pagination
      const individualResponse = await api.get('/individual-purchases', {
        params: { page: currentPage, limit: 100 }
      });
      const individualData = individualResponse.data || [];
      const individualPagination = individualResponse.pagination || {};

      const individualVouchers = individualData.map(v => {
        const passportNumber = v.passport_number || null;
        return {
          ...v,
          type: 'Individual',
          status: getVoucherStatus(v.used_at, v.valid_until, passportNumber),
          customer_name: v.customer_name || v.full_name || 'N/A',
          passport_number: passportNumber,
          invoice_number: 'NA'
        };
      });

      // Load corporate vouchers with pagination
      const corporateResponse = await api.get('/vouchers/corporate-vouchers', {
        params: { page: currentPage, limit: 100 }
      });
      const corporateData = corporateResponse.vouchers || [];
      const corporatePagination = corporateResponse.pagination || {};

      const corporateVouchers = corporateData.map(v => {
        const passportNumber = v.passport_number || v.employee_name || null;
        return {
          ...v,
          type: 'Corporate',
          status: getVoucherStatus(v.redeemed_date || v.used_at, v.valid_until, passportNumber),
          customer_name: v.company_name || 'N/A',
          passport_number: passportNumber,
          invoice_number: v.invoice_number || (v.invoice_id ? String(v.invoice_id) : 'NA')
        };
      });

      const allVouchers = [...individualVouchers, ...corporateVouchers].sort(
        (a, b) => new Date(b.created_at || b.issued_date) - new Date(a.created_at || a.issued_date)
      );

      // Combine pagination info (total from both sources)
      const combinedTotal = (individualPagination.total || 0) + (corporatePagination.total || 0);
      const combinedTotalPages = Math.ceil(combinedTotal / 100);

      setPagination({
        page: currentPage,
        limit: 100,
        total: combinedTotal,
        totalPages: combinedTotalPages
      });

      setVouchers(allVouchers);
      setFilteredVouchers(allVouchers);
    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load vouchers: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVoucherStatus = (usedDate, validUntil, passportNumber) => {
    // Check if passport is NOT registered (null, empty, or string "PENDING")
    if (!passportNumber ||
        passportNumber === '' ||
        String(passportNumber).trim().toUpperCase() === 'PENDING' ||
        String(passportNumber).trim().toUpperCase() === 'N/A' ||
        String(passportNumber).trim().toUpperCase() === 'NA') {
      return 'pending';
    }

    // Check if already used
    if (usedDate) return 'used';

    // Check if expired
    if (new Date(validUntil) < new Date()) return 'expired';

    // All conditions met: has passport, not used, not expired = active
    return 'active';
  };

  const filterVouchers = () => {
    let filtered = vouchers;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => {
        if (typeFilter === 'individual') return v.type === 'Individual';
        if (typeFilter === 'corporate') return v.type === 'Corporate';
        return true;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.voucher_code?.toLowerCase().includes(query) ||
        v.customer_name?.toLowerCase().includes(query) ||
        v.passport_number?.toLowerCase().includes(query) ||
        v.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredVouchers(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      used: 'bg-blue-100 text-blue-700',
      expired: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700'
    };
    const labels = {
      active: 'Active',
      used: 'Used',
      expired: 'Expired',
      pending: 'Pending'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status || '—'}
      </span>
    );
  };

  const handleExportToExcel = () => {
    try {
      const exportData = filteredVouchers.map((voucher) => ({
        'Voucher Code': voucher.voucher_code,
        'Type': voucher.type,
        'Status': voucher.status.toUpperCase(),
        'Customer/Company': voucher.customer_name,
        'Passport/Employee': voucher.passport_number || 'Pending',
        'Invoice #': voucher.invoice_number || 'NA',
        'Valid Until': formatDate(voucher.valid_until),
        'Used Date': voucher.used_at || voucher.redeemed_date
          ? formatDate(voucher.used_at || voucher.redeemed_date)
          : 'Not Used',
        'Created Date': formatDate(voucher.created_at || voucher.issued_date),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const columnWidths = [
        { wch: 25 }, // Voucher Code
        { wch: 12 }, // Type
        { wch: 10 }, // Status
        { wch: 25 }, // Customer/Company
        { wch: 20 }, // Passport/Employee
        { wch: 15 }, // Invoice #
        { wch: 15 }, // Valid Until
        { wch: 15 }, // Used Date
        { wch: 15 }, // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers');

      const filename = `Vouchers_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} vouchers to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export vouchers to Excel.",
      });
    }
  };

  const handlePrintVoucher = (voucher) => {
    setPrintVoucher(voucher);
    setIsPrintDialogOpen(true);
  };

  const handleThermalPrint = (voucher) => {
    // Navigate to thermal print page
    navigate(`/app/thermal-print?codes=${voucher.voucher_code}`);
  };

  const handleClosePrint = () => {
    setIsPrintDialogOpen(false);
    setPrintVoucher(null);
  };

  const handleRegisterPassport = (voucherCode) => {
    navigate(`/app/voucher-registration?code=${voucherCode}`);
  };

  const getStats = () => {
    const stats = {
      total: filteredVouchers.length,
      active: filteredVouchers.filter(v => v.status === 'active').length,
      used: filteredVouchers.filter(v => v.status === 'used').length,
      expired: filteredVouchers.filter(v => v.status === 'expired').length,
      individual: filteredVouchers.filter(v => v.type === 'Individual').length,
      corporate: filteredVouchers.filter(v => v.type === 'Corporate').length,
    };
    return stats;
  };

  const stats = getStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          All Vouchers
        </h1>
        <Button variant="outline" onClick={handleExportToExcel}>
          Export to Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-slate-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
            <p className="text-xs text-slate-600">Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-xs text-slate-600">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.individual}</p>
            <p className="text-xs text-slate-600">Individual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.corporate}</p>
            <p className="text-xs text-slate-600">Corporate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Input
                placeholder="Search by voucher code, customer name, or passport number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Label className="text-sm text-slate-600 whitespace-nowrap">Type:</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Label className="text-sm text-slate-600 whitespace-nowrap">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vouchers List</span>
            <span className="text-base font-normal text-slate-500">
              {isLoading ? 'Loading...' : `${pagination.total} total (page ${pagination.page} of ${pagination.totalPages})`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading vouchers...</div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No vouchers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 font-semibold">Voucher Code</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Customer/Company</th>
                    <th className="pb-3 font-semibold">Passport</th>
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Valid Until</th>
                    <th className="pb-3 font-semibold">Used Date</th>
                    <th className="pb-3 font-semibold">Created</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.map((voucher, idx) => (
                    <tr
                      key={`${voucher.type}-${voucher.id}-${idx}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3">
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          {voucher.voucher_code}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          voucher.type === 'Individual'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {voucher.type}
                        </span>
                      </td>
                      <td className="py-3">
                        {getStatusBadge(voucher.status)}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-800">{voucher.customer_name}</div>
                        <div className="text-xs text-slate-500">{voucher.customer_email || ''}</div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-sm text-slate-800">
                          {voucher.passport_number || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-medium text-slate-800">{voucher.invoice_number || 'NA'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">{formatDate(voucher.valid_until)}</span>
                      </td>
                      <td className="py-3">
                        {voucher.used_at || voucher.redeemed_date ? (
                          <span className="text-blue-600 font-medium">
                            {formatDate(voucher.used_at || voucher.redeemed_date)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-sm">
                          {formatDate(voucher.created_at || voucher.issued_date)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handlePrintVoucher(voucher)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Regular Printer (A4)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleThermalPrint(voucher)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Thermal Printer (80mm)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {!voucher.passport_number && (
                            <Button
                              size="sm"
                              onClick={() => handleRegisterPassport(voucher.voucher_code)}
                              className="h-8 bg-green-600 hover:bg-green-700"
                            >
                              <FileEdit className="h-4 w-4 mr-1" />
                              Register
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vouchers
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium text-slate-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={pagination.page === pagination.totalPages || isLoading}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages || isLoading}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      {printVoucher && (
        <VoucherPrint
          voucher={printVoucher}
          isOpen={isPrintDialogOpen}
          onClose={handleClosePrint}
          voucherType={printVoucher.type}
        />
      )}
    </motion.div>
  );
};

export default VouchersList;
