import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import {
  getInvoices,
  getInvoiceStatistics,
  recordPayment,
  generateVouchers,
  canRecordPayment,
  canGenerateVouchers,
  downloadInvoicePDF,
  emailInvoice,
  getInvoiceVouchers
} from '@/lib/invoiceService';
import { viewInvoicePDF } from '@/lib/invoicePdfService';
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
import { logger } from '@/utils/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');

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

  // Email Modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Voucher Email Modal
  const [voucherEmailModalOpen, setVoucherEmailModalOpen] = useState(false);
  const [voucherEmailAddress, setVoucherEmailAddress] = useState('');
  const [sendingVoucherEmail, setSendingVoucherEmail] = useState(false);

  // Generated Vouchers Modal
  const [generatedVouchersModalOpen, setGeneratedVouchersModalOpen] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState([]);

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
      logger.error('Error loading invoices:', error);
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
      logger.error('Error loading statistics:', error);
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
        title: 'Vouchers Generated Successfully',
        description: `${result.message || `Generated ${result.vouchers?.length} green passes`}`
      });

      setVoucherModalOpen(false);

      // Show generated vouchers in a new modal
      if (result.vouchers && result.vouchers.length > 0) {
        setGeneratedVouchers(result.vouchers);
        setGeneratedVouchersModalOpen(true);
      }

      loadInvoices();
    } catch (error) {
      const errorData = error.response?.data;
      const errorTitle = errorData?.error || 'Error';
      const errorMessage = errorData?.message || 'Failed to generate vouchers';

      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage
      });
      setSelectedInvoice(null);
    } finally {
      setGeneratingVouchers(false);
    }
  };

  const openEmailVouchersModal = (invoice) => {
    if (!invoice) {
      toast({
        title: 'Error',
        description: 'Invoice data not available',
        variant: 'destructive'
      });
      return;
    }
    setSelectedInvoice(invoice);
    setVoucherEmailAddress(invoice.customer_email || '');
    setVoucherEmailModalOpen(true);
  };

  const handleDownloadVouchers = async (invoice) => {
    try {
      logger.log('[VOUCHER DOWNLOAD] Starting download for invoice:', invoice.id);

      // Note: api.get with responseType: 'blob' returns the Blob directly, not an axios-style response
      const blob = await api.get(`/invoices/${invoice.id}/vouchers-pdf`, {
        responseType: 'blob'
      });

      logger.log('[VOUCHER DOWNLOAD] Blob received:', {
        dataType: typeof blob,
        dataSize: blob?.size,
        isBlob: blob instanceof Blob
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      logger.log('[VOUCHER DOWNLOAD] Blob URL created:', url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.customer_name.replace(/\s+/g, '_')}_Vouchers_${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.log('[VOUCHER DOWNLOAD] Download triggered successfully');

      toast({
        title: 'Download Started',
        description: `Downloading vouchers for invoice ${invoice.invoice_number}`
      });
    } catch (error) {
      logger.error('[VOUCHER DOWNLOAD] Error:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        stack: error.stack
      });

      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to download vouchers'
      });
    }
  };

  const handleEmailVouchers = async () => {
    try {
      setSendingVoucherEmail(true);

      const response = await api.post(`/invoices/${selectedInvoice.id}/email-vouchers`, {
        recipient_email: voucherEmailAddress || selectedInvoice.customer_email
      });

      toast({
        title: 'Vouchers Emailed',
        description: response.data?.message || `Vouchers sent successfully to ${voucherEmailAddress || selectedInvoice.customer_email}`
      });

      setVoucherEmailModalOpen(false);
      setVoucherEmailAddress('');
      setSelectedInvoice(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to email vouchers'
      });
    } finally {
      setSendingVoucherEmail(false);
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

  const handleDownloadPDF = async (invoice) => {
    try {
      await downloadInvoicePDF(invoice.id, invoice.invoice_number);
      toast({
        title: 'PDF Downloaded',
        description: `Invoice ${invoice.invoice_number} has been downloaded`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download PDF'
      });
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      await viewInvoicePDF(invoice.id);
      toast({
        title: 'Opening Invoice',
        description: `Opening invoice ${invoice.invoice_number} in new tab`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to view invoice PDF'
      });
    }
  };

  const openEmailModal = (invoice) => {
    setSelectedInvoice(invoice);
    setEmailAddress(invoice.customer_email || '');
    setEmailModalOpen(true);
  };

  const handleEmailInvoice = async () => {
    if (!emailAddress) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter an email address'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address'
      });
      return;
    }

    try {
      setSendingEmail(true);

      await emailInvoice(selectedInvoice.id, emailAddress);

      toast({
        title: 'Email Sent',
        description: `Invoice ${selectedInvoice.invoice_number} has been sent to ${emailAddress}`
      });

      setEmailModalOpen(false);
      setEmailAddress('');
      setSelectedInvoice(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send email'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getSelectedInvoice = () => {
    return invoices.find(inv => inv.id === selectedInvoiceId);
  };

  const handleActionChange = (value) => {
    setSelectedAction(value);
  };

  const handlePerformAction = () => {
    if (!selectedInvoiceId) {
      toast({
        variant: 'destructive',
        title: 'No Selection',
        description: 'Please select an invoice first'
      });
      return;
    }

    const invoice = getSelectedInvoice();
    if (!invoice) return;

    switch (selectedAction) {
      case 'view':
        handleViewInvoice(invoice);
        break;
      case 'download':
        handleDownloadPDF(invoice);
        break;
      case 'email':
        openEmailModal(invoice);
        break;
      case 'register_payment':
        if (canRecordPayment(invoice)) {
          openPaymentModal(invoice);
        } else {
          toast({
            variant: 'destructive',
            title: 'Cannot Record Payment',
            description: 'Invoice is already fully paid'
          });
        }
        break;
      case 'generate': {
        if (invoice.vouchers_generated) {
          toast({
            variant: 'destructive',
            title: 'Cannot Generate Vouchers',
            description: 'Vouchers already generated for this invoice'
          });
          break;
        }
        if (canGenerateVouchers(invoice)) {
          openVoucherModal(invoice);
        } else {
          toast({
            variant: 'destructive',
            title: 'Cannot Generate Vouchers',
            description: 'Invoice must be fully paid to generate vouchers'
          });
        }
        break;
      }
      case 'view_vouchers': {
        if (!invoice.vouchers_generated) {
          toast({
            variant: 'destructive',
            title: 'No Vouchers',
            description: 'Vouchers have not been generated for this invoice yet'
          });
          break;
        }
        setGeneratingVouchers(true);
        getInvoiceVouchers(invoice.id)
          .then((res) => {
            const list = res?.vouchers || [];
            if (list.length === 0) {
              toast({
                variant: 'destructive',
                title: 'No Vouchers Found',
                description: 'No vouchers are linked to this invoice'
              });
              return;
            }
            setSelectedInvoice(invoice);  // Store invoice reference for download/email
            setGeneratedVouchers(list);
            setGeneratedVouchersModalOpen(true);
          })
          .catch((error) => {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: error.response?.data?.error || 'Failed to load vouchers for this invoice'
            });
          })
          .finally(() => setGeneratingVouchers(false));
        break;
      }
      default:
        break;
    }
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

        {/* Action Bar */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-6 border border-emerald-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="invoice-action-select" className="text-sm font-semibold text-slate-700">
                  Select Action:
                </Label>
                <Select value={selectedAction} onValueChange={handleActionChange}>
                  <SelectTrigger id="invoice-action-select" className="w-full sm:w-64 bg-white">
                    <SelectValue placeholder="Choose an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Invoice</SelectItem>
                    <SelectItem value="download">Download Invoice</SelectItem>
                    <SelectItem value="email">Email Invoice</SelectItem>
                    <SelectItem value="register_payment">Register Payment</SelectItem>
                    <SelectItem value="generate">Generate Vouchers</SelectItem>
                    <SelectItem value="view_vouchers">View Vouchers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePerformAction}
                  disabled={
                    !selectedInvoiceId ||
                    !selectedAction ||
                    (selectedAction === 'generate' && (() => {
                      const inv = getSelectedInvoice();
                      return inv ? !canGenerateVouchers(inv) || inv.vouchers_generated : true;
                    })()) ||
                    (selectedAction === 'view_vouchers' && (() => {
                      const inv = getSelectedInvoice();
                      return inv ? !inv.vouchers_generated : true;
                    })())
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Perform Action
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInvoiceId(null);
                    setSelectedAction('');
                  }}
                  className="border-slate-300"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
            {selectedInvoiceId && (
              <div className="text-sm text-emerald-700 font-medium">
                Selected: {getSelectedInvoice()?.invoice_number} - {getSelectedInvoice()?.customer_name}
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Select</th>
                  <th scope="col" className="px-6 py-3">Invoice #</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Due Date</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Paid</th>
                  <th scope="col" className="px-6 py-3">Balance</th>
                  <th scope="col" className="px-6 py-3">Vouchers Generated</th>
                  <th scope="col" className="px-6 py-3">Status</th>
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
                      <tr
                        key={invoice.id}
                        className={`border-b hover:bg-emerald-50 cursor-pointer ${
                          selectedInvoiceId === invoice.id ? 'bg-emerald-100 border-emerald-300' : 'bg-white'
                        }`}
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="radio"
                            name="selectedInvoice"
                            checked={selectedInvoiceId === invoice.id}
                            onChange={() => setSelectedInvoiceId(invoice.id)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                        </td>
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
                          {invoice.vouchers_generated ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-emerald-100 text-emerald-700">
                              YES
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-slate-200 text-slate-700">
                              NO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeClass(displayStatus)}`}>
                            {getStatusText(displayStatus)}
                          </span>
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
                      {(Array.isArray(selectedInvoice.items) ? selectedInvoice.items : JSON.parse(selectedInvoice.items || '[]')).reduce((sum, item) => sum + item.quantity, 0)}
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

        {/* Email Invoice Modal */}
        <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Invoice</DialogTitle>
              <DialogDescription>
                Send invoice {selectedInvoice?.invoice_number} to customer via email
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    The invoice will be sent as a PNG GST-compliant PDF attachment.
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
                    <span className="text-sm text-slate-600">Due Date:</span>
                    <span className="text-sm font-semibold">
                      {new Date(selectedInvoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter or confirm the customer's email address
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailModalOpen(false);
                  setEmailAddress('');
                  setSelectedInvoice(null);
                }}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmailInvoice}
                disabled={sendingEmail}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sendingEmail ? 'Sending...' : '✉️ Send Email'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generated Vouchers Modal */}
        <Dialog open={generatedVouchersModalOpen} onOpenChange={setGeneratedVouchersModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generated Vouchers</DialogTitle>
              <DialogDescription>
                {generatedVouchers.length} green passes generated successfully for {selectedInvoice?.customer_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-700 font-medium">Invoice:</span>{' '}
                    <span className="text-emerald-900">{selectedInvoice?.invoice_number}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Company:</span>{' '}
                    <span className="text-emerald-900">{selectedInvoice?.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Total Vouchers:</span>{' '}
                    <span className="text-emerald-900">{generatedVouchers.length}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">Amount per Voucher:</span>{' '}
                    <span className="text-emerald-900">PGK {generatedVouchers[0]?.amount || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Vouchers Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Voucher Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Valid Until</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedVouchers.map((voucher, index) => (
                      <tr key={voucher.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-600 font-semibold">
                            {voucher.voucher_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">PGK {parseFloat(voucher.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(voucher.valid_until).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {voucher.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDownloadVouchers(selectedInvoice);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                >
                  Download All Vouchers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Email vouchers
                    setGeneratedVouchersModalOpen(false);
                    openEmailVouchersModal(selectedInvoice);
                  }}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  Email Vouchers to Customer
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedVouchersModalOpen(false);
                    setSelectedInvoice(null);
                    setGeneratedVouchers([]);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Vouchers Modal */}
        <Dialog open={voucherEmailModalOpen} onOpenChange={setVoucherEmailModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Vouchers</DialogTitle>
              <DialogDescription>
                Send generated vouchers to {selectedInvoice?.customer_name} via email
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    📄 The vouchers will be sent as a PDF with QR codes (one voucher per page)
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Customer:</span>
                    <span className="text-sm font-semibold">{selectedInvoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Invoice:</span>
                    <span className="text-sm font-semibold">{selectedInvoice.invoice_number}</span>
                  </div>
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={voucherEmailAddress}
                    onChange={(e) => setVoucherEmailAddress(e.target.value)}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter or confirm the customer's email address
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setVoucherEmailModalOpen(false);
                  setVoucherEmailAddress('');
                  setSelectedInvoice(null);
                }}
                disabled={sendingVoucherEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEmailVouchers}
                disabled={sendingVoucherEmail || !voucherEmailAddress}
                className="bg-green-600 hover:bg-green-700"
              >
                {sendingVoucherEmail ? 'Sending...' : '✉️ Send Vouchers'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </main>
  );
};

export default Invoices;
