import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';

const RefundedReport = () => {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [fileNo, setFileNo] = useState('');

  // Summary
  const [summary, setSummary] = useState({
    totalRefunded: 0,
    totalRefundedAmount: 0,
    totalCollected: 0,
    totalOriginalAmount: 0,
  });

  useEffect(() => {
    loadRefunds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [fromDate, toDate, passportNo, fileNo, refunds]);

  const loadRefunds = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/individual-purchases');
      const allPayments = response.data || [];

      // Filter only refunded payments
      const refundedPayments = allPayments.filter(p => p.status === 'refunded');
      setRefunds(refundedPayments);
      setFilteredRefunds(refundedPayments);
      calculateSummary(refundedPayments);
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load refunded payments"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = refunds;

    if (fromDate) {
      filtered = filtered.filter(r => {
        const refundDate = new Date(r.refunded_at).toISOString().split('T')[0];
        return refundDate >= fromDate;
      });
    }

    if (toDate) {
      filtered = filtered.filter(r => {
        const refundDate = new Date(r.refunded_at).toISOString().split('T')[0];
        return refundDate <= toDate;
      });
    }

    if (passportNo) {
      filtered = filtered.filter(r =>
        r.passport_number?.toLowerCase().includes(passportNo.toLowerCase())
      );
    }

    if (fileNo) {
      filtered = filtered.filter(r =>
        r.voucher_code?.toLowerCase().includes(fileNo.toLowerCase())
      );
    }

    setFilteredRefunds(filtered);
    calculateSummary(filtered);
  };

  const calculateSummary = (data) => {
    const summary = {
      totalRefunded: data.length,
      totalRefundedAmount: data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
      totalCollected: data.reduce((sum, r) => sum + parseFloat(r.collected_amount || r.amount || 0), 0),
      totalOriginalAmount: data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
    };
    setSummary(summary);
  };

  const handleFilter = () => {
    applyFilters();
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setPassportNo('');
    setFileNo('');
    setFilteredRefunds(refunds);
    calculateSummary(refunds);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        Refunded Reports
      </h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="SELECT START DATE"
              />
            </div>
            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="SELECT END DATE"
              />
            </div>
            <div>
              <Label htmlFor="passport-no">Passport No</Label>
              <Input
                id="passport-no"
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value)}
                placeholder="PASSPORT NO"
              />
            </div>
            <div>
              <Label htmlFor="file-no">File No</Label>
              <Input
                id="file-no"
                value={fileNo}
                onChange={(e) => setFileNo(e.target.value)}
                placeholder="FILE NO"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="bg-green-600 hover:bg-green-700 flex-1">
                Filter
              </Button>
              <Button onClick={handleClear} variant="outline" className="bg-slate-600 hover:bg-slate-700 text-white flex-1">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-700">{summary.totalRefunded}</div>
                <div className="text-sm text-slate-600 mt-1">Total Refunded</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-700">PGK {summary.totalRefundedAmount.toFixed(2)}</div>
                <div className="text-sm text-slate-600 mt-1">Total Refunded Amount</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-700">PGK {summary.totalCollected.toFixed(2)}</div>
                <div className="text-sm text-slate-600 mt-1">Total Collected</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-700">PGK {summary.totalOriginalAmount.toFixed(2)}</div>
                <div className="text-sm text-slate-600 mt-1">Total Original Amount</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-sm">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Exit Pass Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Passport No</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">File No</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Original Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Collected Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Refunded Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Payment Mode</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-8 text-slate-500">
                      No refunded payments found
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">{refund.id}</td>
                      <td className="py-3 px-4 font-mono text-sm">{refund.voucher_code || 'N/A'}</td>
                      <td className="py-3 px-4">{refund.passport_number}</td>
                      <td className="py-3 px-4">{refund.voucher_code || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold">PGK {parseFloat(refund.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">PGK {parseFloat(refund.collected_amount || refund.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-red-600 font-semibold">
                        PGK {parseFloat(refund.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-sm">
                          {refund.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">{refund.created_by || 'SYSTEM'}</td>
                      <td className="py-3 px-4 text-sm">{formatDateTime(refund.refunded_at)}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase">
                          Refunded
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundedReport;
