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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setPaymentMethod(payment.payment_method || 'CASH');
    }
  }, [payment]);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!paymentMethod) {
        toast({
          title: "Validation Error",
          description: "Please select a payment method",
          variant: "destructive"
        });
        return;
      }

      const updatedData = {
        payment_method: paymentMethod,
      };

      await onSave(payment.id, updatedData);

      toast({
        title: "Payment Updated",
        description: "Payment method has been successfully updated",
      });

      onClose();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment method",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-emerald-600" />
            Edit Payment Method
          </DialogTitle>
          <DialogDescription>
            Update payment method for voucher <strong>{payment?.voucher_code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Payment Info (Read-only) */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Voucher Code</p>
                <p className="font-semibold">{payment?.voucher_code}</p>
              </div>
              <div>
                <p className="text-slate-500">Amount</p>
                <p className="font-semibold">PGK {parseFloat(payment?.amount || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Passport</p>
                <p className="font-semibold">{payment?.passport_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">Current Method</p>
                <p className="font-semibold">{payment?.payment_method || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">New Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
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
            disabled={saving || paymentMethod === payment?.payment_method}
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
