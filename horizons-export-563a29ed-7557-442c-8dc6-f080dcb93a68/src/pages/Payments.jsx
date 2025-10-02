import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, User, Calendar, Shield, Banknote, Check, ChevronsRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

const Payments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMode, setPaymentMode] = useState('BANK TRANSFER');
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);
  const totalAmount = 50.00;

  const amountAfterDiscount = totalAmount - (totalAmount * (discount / 100));
  const returnedAmount = collectedAmount - amountAfterDiscount;

  const handleSubmit = (e) => {
    e.preventDefault();
    const paymentData = {
      totalAmount,
      discount,
      amountAfterDiscount,
      collectedAmount,
      returnedAmount,
      paymentMode,
    };
    console.log('Payment Data:', paymentData);
    toast({
      title: "Payment Processed!",
      description: "The payment has been successfully recorded.",
      variant: "success",
    });
    // In a real app, you'd navigate to a success page or back to the dashboard
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Process Payment</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input id="total_amount" value={totalAmount.toFixed(2)} readOnly className="bg-slate-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount_after_discount">Amount After Discount</Label>
              <Input id="amount_after_discount" value={amountAfterDiscount.toFixed(2)} readOnly className="bg-slate-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collected_amount">Collected Amount</Label>
              <Input id="collected_amount" type="number" value={collectedAmount} onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returned_amount">Returned Amount</Label>
              <Input id="returned_amount" value={returnedAmount > 0 ? returnedAmount.toFixed(2) : '0.00'} readOnly className="bg-slate-100" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Mode</Label>
            <RadioGroup defaultValue="BANK TRANSFER" onValueChange={setPaymentMode} className="flex flex-wrap gap-4">
              {['BANK TRANSFER', 'CASH', 'CHEQUE', 'CREDIT CARD', 'DEBIT CARD'].map(mode => (
                <div key={mode} className="flex items-center space-x-2">
                  <RadioGroupItem value={mode} id={mode} />
                  <Label htmlFor={mode} className="font-normal">{mode}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {['CREDIT CARD', 'DEBIT CARD'].includes(paymentMode) && (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input id="card-number" placeholder="0000 0000 0000 0000" className="pl-10 h-11 border-emerald-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input id="expiry" placeholder="MM / YY" className="pl-10 h-11 border-emerald-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input id="cvc" placeholder="123" className="pl-10 h-11 border-emerald-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              Process Payment <Check className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Payments;