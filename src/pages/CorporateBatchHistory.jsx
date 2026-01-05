import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import ExportButton from '@/components/ExportButton';

const CorporateBatchHistory = () => {
  const { toast } = useToast();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetails, setShowBatchDetails] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    filterBatches();
  }, [batches, searchQuery, statusFilter, dateFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vouchers/corporate-vouchers');
      const data = response.vouchers || [];

      // Group vouchers by batch_id
      const batchMap = new Map();
      data.forEach(voucher => {
        const batchId = voucher.batch_id || 'individual';
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            batchId,
            companyName: voucher.company_name || 'Unknown Company',
            contactEmail: 'N/A', // contact_email column doesn't exist in production DB
            createdBy: 'System', // created_by_name doesn't exist in production DB
            createdAt: voucher.issued_date, // Use issued_date instead of created_at
            vouchers: [],
            totalAmount: 0,
            usedCount: 0,
            status: 'active'
          });
        }

        const batch = batchMap.get(batchId);
        batch.vouchers.push(voucher);
        batch.totalAmount += parseFloat(voucher.amount || 0);
        if (voucher.redeemed_date) { // Use redeemed_date instead of used_at
          batch.usedCount++;
        }
      });

      const batchList = Array.from(batchMap.values()).map(batch => ({
        ...batch,
        voucherCount: batch.vouchers.length,
        usageRate: batch.vouchers.length > 0 ? (batch.usedCount / batch.vouchers.length * 100).toFixed(1) : 0
      }));

      setBatches(batchList);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load corporate batch history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBatches = () => {
    let filtered = [...batches];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.companyName.toLowerCase().includes(query) ||
        batch.contactEmail.toLowerCase().includes(query) ||
        batch.createdBy.toLowerCase().includes(query) ||
        batch.batchId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'used') {
        filtered = filtered.filter(batch => batch.usedCount > 0);
      } else if (statusFilter === 'unused') {
        filtered = filtered.filter(batch => batch.usedCount === 0);
      } else if (statusFilter === 'partial') {
        filtered = filtered.filter(batch => batch.usedCount > 0 && batch.usedCount < batch.voucherCount);
      }
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filtered = filtered.filter(batch => {
        const batchDate = new Date(batch.createdAt);
        return batchDate >= filterDate && batchDate < nextDay;
      });
    }

    setFilteredBatches(filtered);
  };

  const downloadBatchZip = async (batchId) => {
    try {
      toast({
        title: "Preparing Download",
        description: "Creating ZIP file with all vouchers...",
        variant: "default"
      });

      // Download the ZIP file
      const response = await api.get(`/vouchers/download-batch/${batchId}`, {
        responseType: 'blob'
      });

      // Create blob from response
      const blob = new Blob([response], { type: 'application/zip' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Batch_${batchId}_Vouchers.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "Batch ZIP file downloaded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error downloading batch:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download batch ZIP",
        variant: "destructive"
      });
    }
  };

  const emailBatch = async (batchId, companyEmail) => {
    try {
      if (!companyEmail || companyEmail === 'No email') {
        toast({
          title: "No Email Address",
          description: "No email address found for this company",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sending Email",
        description: `Preparing to send batch vouchers to ${companyEmail}...`,
        variant: "default"
      });

      // Call API to email batch
      const response = await api.post('/vouchers/email-batch', {
        batch_id: batchId,
        recipient_email: companyEmail
      });

      if (response.success) {
        toast({
          title: "Email Sent",
          description: `Successfully sent ${response.voucher_count} vouchers to ${companyEmail}`,
          variant: "default"
        });
      } else {
        throw new Error(response.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error emailing batch:', error);

      // Handle specific error messages
      let errorMessage = error.message || "Failed to send batch email";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Email Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const exportColumns = [
    { name: 'Batch ID', selector: row => row.batchId },
    { name: 'Company', selector: row => row.companyName },
    { name: 'Contact Email', selector: row => row.contactEmail },
    { name: 'Created By', selector: row => row.createdBy },
    { name: 'Created Date', selector: row => new Date(row.createdAt).toLocaleString() },
    { name: 'Voucher Count', selector: row => row.voucherCount },
    { name: 'Total Amount', selector: row => `PGK ${row.totalAmount.toFixed(2)}` },
    { name: 'Used Count', selector: row => row.usedCount },
    { name: 'Usage Rate', selector: row => `${row.usageRate}%` },
  ];

  const stats = {
    total: filteredBatches.length,
    totalVouchers: filteredBatches.reduce((sum, batch) => sum + batch.voucherCount, 0),
    totalAmount: filteredBatches.reduce((sum, batch) => sum + batch.totalAmount, 0),
    usedVouchers: filteredBatches.reduce((sum, batch) => sum + batch.usedCount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Corporate Batch History
          </h1>
          <p className="text-slate-600 mt-1">View and manage corporate voucher batches</p>
        </div>
        <ExportButton
          data={filteredBatches}
          columns={exportColumns}
          filename="Corporate_Batch_History_Report"
          title="Corporate Batch History Report"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-slate-500">Total Batches</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-slate-500">Total Vouchers</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-2xl font-bold text-slate-800">PGK {stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-slate-500">Used Vouchers</p>
                <p className="text-2xl font-bold text-slate-800">{stats.usedVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <Input
                placeholder="Search by company, email, or batch ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="partial">Partially used</SelectItem>
                  <SelectItem value="used">Fully used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch List */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Batches ({filteredBatches.length} batches)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No corporate batches found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBatches.map((batch, index) => (
                <motion.div
                  key={batch.batchId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {batch.companyName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Batch ID: {batch.batchId} • Created by {batch.createdBy}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{batch.voucherCount} vouchers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>PGK {batch.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{batch.usageRate}% used</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowBatchDetails(true);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBatchZip(batch.batchId)}
                      >
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => emailBatch(batch.batchId, batch.contactEmail)}
                      >
                        Email
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Modal */}
      {showBatchDetails && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Batch Details - {selectedBatch.companyName}</span>
                <Button variant="outline" onClick={() => setShowBatchDetails(false)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Batch ID</p>
                  <p className="font-semibold">{selectedBatch.batchId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Company</p>
                  <p className="font-semibold">{selectedBatch.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Contact Email</p>
                  <p className="font-semibold">{selectedBatch.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created By</p>
                  <p className="font-semibold">{selectedBatch.createdBy}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Vouchers in this batch:</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Voucher Code</th>
                        <th className="px-3 py-2 text-left">Passport</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatch.vouchers.map((voucher, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-3 py-2 font-mono">{voucher.voucher_code}</td>
                          <td className="px-3 py-2">{voucher.passport_number}</td>
                          <td className="px-3 py-2">PGK {voucher.amount}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              voucher.redeemed_date
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {voucher.redeemed_date ? 'Used' : 'Unused'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CorporateBatchHistory;