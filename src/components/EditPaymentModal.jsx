import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Save, X } from 'lucide-react';

const EditPaymentModal = ({ payment, isOpen, onClose, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: '',
    discount: '',
    collected_amount: '',
    payment_method: '',
    valid_until: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || '',
        discount: payment.discount || 0,
        collected_amount: payment.collected_amount || payment.amount,
        payment_method: payment.payment_method || 'CASH',
        valid_until: payment.valid_until ? new Date(payment.valid_until).toISOString().split('T')[0] : '',
      });
    }
  }, [payment]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAmounts = () => {
    const amount = parseFloat(formData.amount) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const amountAfterDiscount = amount - (amount * (discount / 100));
    const collectedAmount = parseFloat(formData.collected_amount) || 0;
    const returnedAmount = collectedAmount - amountAfterDiscount;

    return {
      amount,
      discount,
      amountAfterDiscount,
      collectedAmount,
      returnedAmount: returnedAmount > 0 ? returnedAmount : 0
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const amounts = calculateAmounts();

      // Validation
      if (amounts.amount <= 0) {
        toast({
          title: "Validation Error",
          description: "Amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (amounts.discount < 0 || amounts.discount > 100) {
        toast({
          title: "Validation Error",
          description: "Discount must be between 0 and 100",
          variant: "destructive"
        });
        return;
      }

      if (!formData.valid_until) {
        toast({
          title: "Validation Error",
          description: "Valid until date is required",
          variant: "destructive"
        });
        return;
      }

      const updatedData = {
        amount: amounts.amount,
        discount: amounts.discount,
        collected_amount: amounts.collectedAmount,
        returned_amount: amounts.returnedAmount,
        payment_method: formData.payment_method,
        valid_until: formData.valid_until,
      };

      await onSave(payment.id, updatedData);

      toast({
        title: "Payment Updated",
        description: "Payment details have been successfully updated",
      });

      onClose();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const amounts = calculateAmounts();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-emerald-600" />
            Edit Payment
          </DialogTitle>
          <DialogDescription>
            Update payment details for voucher <strong>{payment?.voucher_code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Payment Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PGK)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="50.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => handleChange('discount', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collected_amount">Collected Amount (PGK)</Label>
                <Input
                  id="collected_amount"
                  type="number"
                  step="0.01"
                  value={formData.collected_amount}
                  onChange={(e) => handleChange('collected_amount', e.target.value)}
                  placeholder="50.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleChange('payment_method', value)}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CREDIT CARD">Credit Card</SelectItem>
                    <SelectItem value="DEBIT CARD">Debit Card</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="EFTPOS">EFTPOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => handleChange('valid_until', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Calculated Values */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-700">Calculated Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Amount After Discount</p>
                <p className="font-semibold text-lg">PGK {amounts.amountAfterDiscount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Collected</p>
                <p className="font-semibold text-lg">PGK {amounts.collectedAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Change Returned</p>
                <p className="font-semibold text-lg">PGK {amounts.returnedAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Original Values (Read-only) */}
          <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 text-sm">Original Values (Reference)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-blue-600">Original Amount</p>
                <p className="font-medium">PGK {payment?.amount || 0}</p>
              </div>
              <div>
                <p className="text-blue-600">Original Discount</p>
                <p className="font-medium">{payment?.discount || 0}%</p>
              </div>
              <div>
                <p className="text-blue-600">Original Method</p>
                <p className="font-medium">{payment?.payment_method || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentModal;
