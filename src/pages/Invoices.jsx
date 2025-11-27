import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInvoices,
  getInvoiceStatistics,
  recordPayment,
  generateVouchers,
  canRecordPayment,
  canGenerateVouchers
} from '@/lib/invoiceService';
import {
  formatPGK,
  getStatusBadgeClass,
  getStatusText,
  isOverdue,
  calculatePaymentProgress
} from '@/lib/gstUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const Invoices = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Voucher Generation Modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [generatingVouchers, setGeneratingVouchers] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter,
        customer: customerFilter,
        from_date: fromDate,
        to_date: toDate
      };
      const data = await getInvoices(filters);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load invoices'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getInvoiceStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount'
      });
      return;
    }

    try {
      setProcessing(true);

      await recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentReference,
        notes: paymentNotes
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatPGK(paymentAmount)} recorded successfully`
      });

      setPaymentModalOpen(false);
      resetPaymentForm();
      loadInvoices();
      loadStatistics();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to record payment'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateVouchers = async () => {
    try {
      setGeneratingVouchers(true);

      const result = await generateVouchers(selectedInvoice.id);

      toast({
        title: 'Vouchers Generated',
        description: result.message || `Generated ${result.vouchers?.length} green passes`
      });

      setVoucherModalOpen(false);
      setSelectedInvoice(null);
      loadInvoices();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate vouchers'
      });
    } finally {
      setGeneratingVouchers(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.amount_due || '');
    setPaymentModalOpen(true);
  };

  const openVoucherModal = (invoice) => {
    setSelectedInvoice(invoice);
    setVoucherModalOpen(true);
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
    setSelectedInvoice(null);
  };

  const stats = statistics ? [
    { title: 'Total Invoices', value: statistics.total_count || '0' },
    { title: 'Pending', value: statistics.pending_count || '0' },
    { title: 'Partial Payment', value: statistics.partial_count || '0' },
    { title: 'Paid', value: statistics.paid_count || '0' },
    { title: 'Overdue', value: statistics.overdue_count || '0' },
  ] : [
    { title: 'Total Invoices', value: '0' },
    { title: 'Pending', value: '0' },
    { title: 'Partial Payment', value: '0' },
    { title: 'Paid', value: '0' },
    { title: 'Overdue', value: '0' },
  ];

  const summaryStats = statistics ? [
    { title: 'Total Value', value: formatPGK(statistics.total_value || 0) },
    { title: 'Collected', value: formatPGK(statistics.total_collected || 0) },
    { title: 'Outstanding', value: formatPGK(statistics.total_outstanding || 0) },
  ] : [
    { title: 'Total Value', value: formatPGK(0) },
    { title: 'Collected', value: formatPGK(0) },
    { title: 'Outstanding', value: formatPGK(0) },
  ];

  return (
    <main>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Tax Invoices
          </h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryStats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial Payment</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Label>Customer</Label>
              <Input
                placeholder="Search customer..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              />
            </div>

            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={loadInvoices} className="flex-1">
                Filter
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('');
                  setCustomerFilter('');
                  setFromDate('');
                  setToDate('');
                  loadInvoices();
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Invoice #</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Due Date</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Paid</th>
                  <th scope="col" className="px-6 py-3">Balance</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-16">
                      <h3 className="mt-2 text-lg font-medium text-slate-800">No invoices found</h3>
                      <p className="mt-1 text-sm text-slate-500">Invoices are created from approved quotations</p>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const overdueStatus = isOverdue(invoice.due_date, invoice.status);
                    const displayStatus = overdueStatus ? 'overdue' : invoice.status;
                    const paymentProgress = calculatePaymentProgress(
                      invoice.amount_paid || 0,
                      invoice.total_amount
                    );

                    return (
                      <tr key={invoice.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4">
                          <div>{invoice.customer_name}</div>
                          <div className="text-xs text-slate-500">{invoice.customer_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {formatPGK(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatPGK(invoice.amount_paid || 0)}
                          {invoice.status !== 'pending' && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${paymentProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatPGK(invoice.amount_due || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeClass(displayStatus)}`}>
                            {getStatusText(displayStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {canRecordPayment(invoice) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentModal(invoice)}
                              >
                                Record Payment
                              </Button>
                            )}

                            {canGenerateVouchers(invoice) && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => openVoucherModal(invoice)}
                              >
                                Generate Vouchers
                              </Button>
                            )}

                            {invoice.vouchers_generated && (
                              <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">
                                ✓ Vouchers Generated
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-500 mt-4 text-center">
            Showing all {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Payment Recording Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for invoice {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Customer:</span>
                    <span className="text-sm font-semibold">{selectedInvoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Amount:</span>
                    <span className="text-sm font-semibold">{formatPGK(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Amount Paid:</span>
                    <span className="text-sm font-semibold">{formatPGK(selectedInvoice.amount_paid || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Balance Due:</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatPGK(selectedInvoice.amount_due || 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Payment Amount (PGK)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK TRANSFER">Bank Transfer</option>
                    <option value="EFTPOS">EFTPOS</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label>Reference Number (Optional)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction reference, receipt number, etc."
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setPaymentModalOpen(false); resetPaymentForm(); }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voucher Generation Modal */}
        <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Green Passes (Vouchers)</DialogTitle>
              <DialogDescription>
                Generate vouchers with QR codes for invoice {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-800">
                    This invoice has been fully paid. Generate green passes (vouchers with QR codes) for the customer.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Customer:</span>
                    <span className="text-sm font-semibold">{selectedInvoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Invoice Amount:</span>
                    <span className="text-sm font-semibold">{formatPGK(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Vouchers to Generate:</span>
                    <span className="text-sm font-semibold">
                      {JSON.parse(selectedInvoice.items || '[]').reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setVoucherModalOpen(false); setSelectedInvoice(null); }}
                disabled={generatingVouchers}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateVouchers}
                disabled={generatingVouchers}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {generatingVouchers ? 'Generating...' : 'Generate Vouchers'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </main>
  );
};

export default Invoices;
