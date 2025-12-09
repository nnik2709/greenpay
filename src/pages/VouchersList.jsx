import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import * as XLSX from 'xlsx';

const VouchersList = () => {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, individual, corporate
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, used, expired

  useEffect(() => {
    loadVouchers();
  }, []);

  useEffect(() => {
    filterVouchers();
  }, [searchQuery, vouchers, typeFilter, statusFilter]);

  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      // Load individual vouchers
      const individualResponse = await api.get('/individual-purchases');
      const individualVouchers = (individualResponse.data || []).map(v => ({
        ...v,
        type: 'Individual',
        status: getVoucherStatus(v.used_at, v.valid_until),
        customer_name: v.customer_name || v.full_name || 'N/A',
        passport_number: v.passport_number || 'N/A'
      }));

      // Load corporate vouchers
      const corporateResponse = await api.get('/vouchers/corporate-vouchers');
      const corporateVouchers = (corporateResponse.vouchers || []).map(v => ({
        ...v,
        type: 'Corporate',
        status: getVoucherStatus(v.redeemed_date || v.used_at, v.valid_until),
        customer_name: v.company_name || 'N/A',
        passport_number: v.passport_number || v.employee_name || 'N/A'
      }));

      const allVouchers = [...individualVouchers, ...corporateVouchers].sort(
        (a, b) => new Date(b.created_at || b.issued_date) - new Date(a.created_at || a.issued_date)
      );

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

  const getVoucherStatus = (usedDate, validUntil) => {
    if (usedDate) return 'used';
    if (new Date(validUntil) < new Date()) return 'expired';
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
      expired: 'bg-red-100 text-red-700'
    };
    const labels = {
      active: 'Active',
      used: 'Used',
      expired: 'Expired'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
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
        'Passport/Employee': voucher.passport_number,
        'Amount (PGK)': voucher.amount,
        'Valid Until': new Date(voucher.valid_until).toLocaleDateString(),
        'Used Date': voucher.used_at || voucher.redeemed_date
          ? new Date(voucher.used_at || voucher.redeemed_date).toLocaleDateString()
          : 'Not Used',
        'Created Date': new Date(voucher.created_at || voucher.issued_date).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const columnWidths = [
        { wch: 25 }, // Voucher Code
        { wch: 12 }, // Type
        { wch: 10 }, // Status
        { wch: 25 }, // Customer/Company
        { wch: 20 }, // Passport/Employee
        { wch: 12 }, // Amount
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vouchers List ({filteredVouchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading vouchers...</div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No vouchers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-600">
                    <th className="pb-3 font-semibold">Voucher Code</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Customer/Company</th>
                    <th className="pb-3 font-semibold">Passport/Employee</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Valid Until</th>
                    <th className="pb-3 font-semibold">Used Date</th>
                    <th className="pb-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((voucher) => (
                    <tr key={`${voucher.type}-${voucher.id}`} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          {voucher.voucher_code}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          voucher.type === 'Individual'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {voucher.type}
                        </span>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(voucher.status)}
                      </td>
                      <td className="py-4">
                        <span>{voucher.customer_name}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-sm">{voucher.passport_number}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold">PGK {voucher.amount}</span>
                      </td>
                      <td className="py-4">
                        <span>{new Date(voucher.valid_until).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4">
                        {voucher.used_at || voucher.redeemed_date ? (
                          <span className="text-blue-600">
                            {new Date(voucher.used_at || voucher.redeemed_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-sm">
                          {new Date(voucher.created_at || voucher.issued_date).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VouchersList;
