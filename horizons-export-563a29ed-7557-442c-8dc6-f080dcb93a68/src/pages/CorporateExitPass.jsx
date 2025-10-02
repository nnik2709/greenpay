
    import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { useToast } from '@/components/ui/use-toast';
    import { Search, Plus, History } from 'lucide-react';

    const CorporateExitPass = () => {
      const { toast } = useToast();
      const [totalVouchers, setTotalVouchers] = useState(1);
      const [discount, setDiscount] = useState(0);
      const [collectedAmount, setCollectedAmount] = useState(50);
      const voucherValue = 50;

      const totalAmount = totalVouchers * voucherValue;
      const amountAfterDiscount = totalAmount - (totalAmount * (discount / 100));
      const returnedAmount = collectedAmount - amountAfterDiscount;

      useEffect(() => {
        setCollectedAmount(amountAfterDiscount);
      }, [amountAfterDiscount]);

      const handleSubmit = (e) => {
        e.preventDefault();
        toast({
          title: "Success!",
          description: "Exit Pass batch has been created.",
        });
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Corporate Exit Pass
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="total_vouchers">Total Vouchers</Label>
                      <Input id="total_vouchers" type="number" value={totalVouchers} onChange={(e) => setTotalVouchers(parseInt(e.target.value, 10) || 1)} />
                    </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Validity Date</Label>
                      <Input value="October 1, 2026" readOnly className="bg-slate-100" />
                    </div>
                    <div className="space-y-3">
                      <Label>Payment Mode</Label>
                      <RadioGroup defaultValue="BANK TRANSFER" className="flex flex-wrap gap-4 pt-2">
                        {['BANK TRANSFER', 'CASH', 'CHEQUE', 'CREDIT CARD', 'DEBIT CARD'].map(mode => (
                          <div key={mode} className="flex items-center space-x-2">
                            <RadioGroupItem value={mode} id={`corp-${mode}`} />
                            <Label htmlFor={`corp-${mode}`} className="font-normal">{mode}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Get Exit Pass
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 h-full">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
                  Search File No.
                </h3>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Search..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                <Button variant="link" className="p-0 h-auto text-emerald-600">Reset Purchases</Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    };

    export default CorporateExitPass;
  