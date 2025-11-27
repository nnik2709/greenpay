import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api/client';
import { getPaymentModes } from '@/lib/paymentModesStorage';

const PaymentsList = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentModes, setPaymentModes] = useState([]);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [passportFilter, setPassportFilter] = useState('');
  const [fileNoFilter, setFileNoFilter] = useState('');

  // Edit modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState('');

  // Refund modal
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundingPayment, setRefundingPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundPaymentMethod, setRefundPaymentMethod] = useState('');

  // View refund payments
  const [showOnlyRefunds, setShowOnlyRefunds] = useState(false);

  useEffect(() => {
    loadPayments();
    loadPaymentModes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [dateFilter, passportFilter, fileNoFilter, payments, showOnlyRefunds]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/individual-purchases');
      const paymentsData = response.data || [];
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payments"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentModes = async () => {
    try {
      const modes = await getPaymentModes();
      setPaymentModes(modes);
    } catch (error) {
      console.error('Error loading payment modes:', error);
    }
  };

  const applyFilters = () => {
    let filtered = payments;

    // Filter by refund status first
    if (showOnlyRefunds) {
      filtered = filtered.filter(p => p.status === 'refunded');
    }

    if (dateFilter) {
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.created_at).toISOString().split('T')[0];
        return paymentDate === dateFilter;
      });
    }

    if (passportFilter) {
      filtered = filtered.filter(p =>
        p.passport_number?.toLowerCase().includes(passportFilter.toLowerCase())
      );
    }

    if (fileNoFilter) {
      filtered = filtered.filter(p =>
        p.voucher_code?.toLowerCase().includes(fileNoFilter.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const handleClearFilters = () => {
    setDateFilter('');
    setPassportFilter('');
    setFileNoFilter('');
    setShowOnlyRefunds(false);
    setFilteredPayments(payments);
  };

  const handleToggleRefundView = () => {
    setShowOnlyRefunds(!showOnlyRefunds);
  };

  const handleUpdateRefundStatus = async (payment, newStatus) => {
    try {
      await api.get(`/individual-purchases/${payment.id}/update-refund-status`, {
        params: { refund_status: newStatus }
      });

      toast({
        title: "Success",
        description: `Refund status updated to ${newStatus}`
      });

      loadPayments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update refund status"
      });
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setEditPaymentMethod(payment.payment_method);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.get(`/individual-purchases/${editingPayment.id}/update-payment-method`, {
        params: { payment_method: editPaymentMethod }
      });

      toast({
        title: "Success",
        description: "Payment method updated successfully"
      });

      setEditDialogOpen(false);
      loadPayments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update payment method"
      });
    }
  };

  const handleRefundPayment = (payment) => {
    setRefundingPayment(payment);
    setRefundReason('');
    setRefundPaymentMethod('');
    setRefundDialogOpen(true);
  };

  const handleConfirmRefund = async () => {
    if (!refundReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for the refund"
      });
      return;
    }

    if (!refundPaymentMethod) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a refund payment method"
      });
      return;
    }

    try {
      await api.get(`/individual-purchases/${refundingPayment.id}/refund`, {
        params: {
          reason: refundReason,
          refund_payment_method: refundPaymentMethod
        }
      });

      toast({
        title: "Refund Initiated",
        description: "Refund is pending. Click on 'Pending Refund' status to mark as completed once payment is made."
      });

      setRefundDialogOpen(false);
      loadPayments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process refund"
      });
    }
  };

  const formatDateTime = (dateString) => {
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {showOnlyRefunds ? 'Refunded Payments' : 'Payments'}
        </h1>
        <Button
          variant="outline"
          className={showOnlyRefunds ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"}
          onClick={handleToggleRefundView}
        >
          {showOnlyRefunds ? 'View All Payments' : 'View Refund Payments'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <Label htmlFor="passport-filter">Passport No</Label>
              <Input
                id="passport-filter"
                value={passportFilter}
                onChange={(e) => setPassportFilter(e.target.value)}
                placeholder="PASSPORT NO"
              />
            </div>
            <div>
              <Label htmlFor="file-filter">File No</Label>
              <Input
                id="file-filter"
                value={fileNoFilter}
                onChange={(e) => setFileNoFilter(e.target.value)}
                placeholder="FILE NO"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="bg-green-600 hover:bg-green-700">
                Filter
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-sm">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Exit Pass Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Passport No</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Payment Mode</th>
                  {!showOnlyRefunds && (
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-sm">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Date & Time</th>
                  {showOnlyRefunds && (
                    <>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Refund Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Refund Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Refunded By</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Refunded At</th>
                    </>
                  )}
                  {!showOnlyRefunds && (
                    <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={showOnlyRefunds ? "10" : "8"} className="text-center py-8 text-slate-500">
                      {showOnlyRefunds ? 'No refunded payments found' : 'No payments found'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className={`border-b hover:bg-slate-50 ${payment.status === 'refunded' ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-4">{payment.id}</td>
                      <td className="py-3 px-4 font-mono text-sm">{payment.voucher_code || 'N/A'}</td>
                      <td className="py-3 px-4">{payment.passport_number}</td>
                      <td className="py-3 px-4 font-semibold">PGK {payment.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-sm">
                          {payment.payment_method}
                        </span>
                      </td>
                      {!showOnlyRefunds && (
                        <td className="py-3 px-4">
                          {payment.status === 'refunded' ? (
                            <div className="flex flex-col gap-1">
                              {payment.refund_status === 'pending' ? (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold uppercase cursor-pointer hover:bg-yellow-200"
                                      onClick={() => handleUpdateRefundStatus(payment, 'completed')}>
                                  Pending Refund
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase">
                                  Refunded
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">
                              Active
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">{payment.created_by || 'SYSTEM'}</td>
                      <td className="py-3 px-4 text-sm">{formatDateTime(payment.created_at)}</td>
                      {showOnlyRefunds && (
                        <>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                              {payment.refund_payment_method || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{payment.refund_reason}</td>
                          <td className="py-3 px-4 text-sm">{payment.refunded_by}</td>
                          <td className="py-3 px-4 text-sm">{payment.refunded_at ? formatDateTime(payment.refunded_at) : '-'}</td>
                        </>
                      )}
                      {!showOnlyRefunds && (
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPayment(payment)}
                              disabled={payment.status === 'refunded'}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRefundPayment(payment)}
                              disabled={payment.status === 'refunded'}
                            >
                              Refund
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment method for payment #{editingPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {editingPayment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Payment Method</Label>
                <div className="text-sm text-slate-600">
                  Current: <span className="font-semibold">{editingPayment.payment_method}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Mode</Label>
                <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map(mode => (
                      <SelectItem key={mode.id} value={mode.name}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Payment Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Process refund for payment #{refundingPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {refundingPayment && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-slate-600">Amount:</span>{' '}
                  <span className="font-semibold">PGK {refundingPayment.amount}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">Passport:</span>{' '}
                  <span className="font-semibold">{refundingPayment.passport_number}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">Original Payment Method:</span>{' '}
                  <span className="font-semibold">{refundingPayment.payment_method}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-payment-method">Refund Method *</Label>
                <Select value={refundPaymentMethod} onValueChange={setRefundPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map(mode => (
                      <SelectItem key={mode.id} value={mode.name}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  How the refund will be paid to the customer (may differ from original payment)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund *</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRefund}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsList;
