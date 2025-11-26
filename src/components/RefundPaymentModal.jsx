import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RefundPaymentModal = ({ payment, isOpen, onClose, onRefund }) => {
  const { toast } = useToast();
  const [refundData, setRefundData] = useState({
    refund_amount: '',
    refund_reason: '',
    refund_method: 'CASH',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleChange = (field, value) => {
    setRefundData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefund = async () => {
    try {
      setProcessing(true);

      const refundAmount = parseFloat(refundData.refund_amount);
      const originalAmount = parseFloat(payment.amount);

      // Validation
      if (!refundAmount || refundAmount <= 0) {
        toast({
          title: "Validation Error",
          description: "Refund amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (refundAmount > originalAmount) {
        toast({
          title: "Validation Error",
          description: "Refund amount cannot exceed original payment amount",
          variant: "destructive"
        });
        return;
      }

      if (!refundData.refund_reason) {
        toast({
          title: "Validation Error",
          description: "Please select a refund reason",
          variant: "destructive"
        });
        return;
      }

      const refundPayload = {
        ...refundData,
        refund_amount: refundAmount,
        original_amount: originalAmount,
        voucher_code: payment.voucher_code,
        passport_number: payment.passport_number,
        refunded_at: new Date().toISOString(),
      };

      await onRefund(payment.id, refundPayload);

      toast({
        title: "Refund Processed",
        description: `Successfully refunded PGK ${refundAmount.toFixed(2)}`,
      });

      // Reset form
      setRefundData({
        refund_amount: '',
        refund_reason: '',
        refund_method: 'CASH',
        notes: ''
      });

      onClose();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const refundAmount = parseFloat(refundData.refund_amount) || 0;
  const originalAmount = parseFloat(payment?.amount) || 0;
  const isPartialRefund = refundAmount > 0 && refundAmount < originalAmount;
  const isFullRefund = refundAmount === originalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Process refund for voucher <strong>{payment?.voucher_code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Summary */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-slate-700">Payment Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Voucher Code</p>
                <p className="font-medium">{payment?.voucher_code}</p>
              </div>
              <div>
                <p className="text-slate-500">Passport Number</p>
                <p className="font-medium">{payment?.passport_number}</p>
              </div>
              <div>
                <p className="text-slate-500">Original Amount</p>
                <p className="font-semibold text-lg">PGK {originalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Payment Method</p>
                <p className="font-medium">{payment?.payment_method}</p>
              </div>
              <div>
                <p className="text-slate-500">Payment Date</p>
                <p className="font-medium">
                  {payment?.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-medium">
                  {payment?.used_at ? (
                    <span className="text-red-600">Used</span>
                  ) : (
                    <span className="text-green-600">Valid</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for used vouchers */}
          {payment?.used_at && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This voucher has already been used on {new Date(payment.used_at).toLocaleDateString()}.
                Refunding will not reverse the usage status.
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Refund Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refund_amount">Refund Amount (PGK) *</Label>
                <Input
                  id="refund_amount"
                  type="number"
                  step="0.01"
                  max={originalAmount}
                  value={refundData.refund_amount}
                  onChange={(e) => handleChange('refund_amount', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500">
                  Maximum: PGK {originalAmount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund_method">Refund Method *</Label>
                <Select
                  value={refundData.refund_method}
                  onValueChange={(value) => handleChange('refund_method', value)}
                >
                  <SelectTrigger id="refund_method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CREDIT CARD">Credit to Card</SelectItem>
                    <SelectItem value="DEBIT CARD">Credit to Debit Card</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="refund_reason">Refund Reason *</Label>
                <Select
                  value={refundData.refund_reason}
                  onValueChange={(value) => handleChange('refund_reason', value)}
                >
                  <SelectTrigger id="refund_reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER_REQUEST">Customer Request</SelectItem>
                    <SelectItem value="DUPLICATE_PAYMENT">Duplicate Payment</SelectItem>
                    <SelectItem value="INCORRECT_AMOUNT">Incorrect Amount</SelectItem>
                    <SelectItem value="SERVICE_NOT_PROVIDED">Service Not Provided</SelectItem>
                    <SelectItem value="VOUCHER_ERROR">Voucher Error</SelectItem>
                    <SelectItem value="ADMINISTRATIVE">Administrative Adjustment</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={refundData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Enter any additional details about this refund..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Refund Summary */}
          {refundAmount > 0 && (
            <div className={`p-4 rounded-lg border-2 ${
              isFullRefund ? 'bg-orange-50 border-orange-300' :
              isPartialRefund ? 'bg-yellow-50 border-yellow-300' :
              'bg-slate-50 border-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                {isFullRefund ? (
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">
                    {isFullRefund ? 'Full Refund' : isPartialRefund ? 'Partial Refund' : 'Refund Summary'}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Original</p>
                      <p className="font-semibold">PGK {originalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Refunding</p>
                      <p className="font-semibold text-red-600">-PGK {refundAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Remaining</p>
                      <p className="font-semibold">PGK {(originalAmount - refundAmount).toFixed(2)}</p>
                    </div>
                  </div>
                  {isFullRefund && (
                    <p className="text-xs text-orange-700 mt-2">
                      ⚠️ This will mark the payment as fully refunded and void the voucher.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRefund}
            disabled={processing || !refundAmount || refundAmount <= 0}
            className="bg-red-600 hover:bg-red-700"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {processing ? 'Processing...' : `Process Refund (PGK ${refundAmount.toFixed(2)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundPaymentModal;
