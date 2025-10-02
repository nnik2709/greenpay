
    import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/components/ui/use-toast';
    import { useNavigate } from 'react-router-dom';
    import { Search, Plus, ListOrdered, Bold, Highlighter, Trash2 } from 'lucide-react';

    const CreateQuotation = () => {
      const { toast } = useToast();
      const navigate = useNavigate();
      const [totalVouchers, setTotalVouchers] = useState(1);
      const [discount, setDiscount] = useState(0);
      const voucherValue = 50;

      const totalAmount = totalVouchers * voucherValue;
      const discountAmount = totalAmount * (discount / 100);
      const amountAfterDiscount = totalAmount - discountAmount;

      const handleSubmit = (e) => {
        e.preventDefault();
        toast({
          title: "Quotation Created!",
          description: "The new quotation has been saved successfully.",
        });
        navigate('/quotations');
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Create New Quotation
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input id="client_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_email">Client Email *</Label>
                    <Input id="client_email" type="email" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="total_vouchers">Total Vouchers *</Label>
                    <Input id="total_vouchers" type="number" value={totalVouchers} onChange={(e) => setTotalVouchers(parseInt(e.target.value, 10) || 1)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucher_value">Voucher Value (PGK) *</Label>
                    <Input id="voucher_value" value={voucherValue.toFixed(2)} readOnly className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input id="due_date" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input id="total_amount" value={`PGK ${totalAmount.toFixed(2)}`} readOnly className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input id="discount_amount" value={`PGK ${discountAmount.toFixed(2)}`} readOnly className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount_after_discount">Amount After Discount</Label>
                    <Input id="amount_after_discount" value={`PGK ${amountAfterDiscount.toFixed(2)}`} readOnly className="bg-slate-100" />
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until *</Label>
                    <Input id="valid_until" type="date" defaultValue="2026-10-02" required />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <div className="flex items-center gap-2 border border-input rounded-t-md p-2 bg-slate-50">
                    <Button type="button" variant="ghost" size="sm"><ListOrdered className="w-4 h-4 mr-1" /> Add Bullet Point</Button>
                    <Button type="button" variant="ghost" size="sm"><ListOrdered className="w-4 h-4 mr-1" /> Add Numbered Point</Button>
                    <Button type="button" variant="ghost" size="sm"><Bold className="w-4 h-4 mr-1" /> Bold</Button>
                    <Button type="button" variant="ghost" size="sm"><Highlighter className="w-4 h-4 mr-1" /> Highlight</Button>
                    <Button type="button" variant="ghost" size="sm"><Trash2 className="w-4 h-4 mr-1" /> Clear All</Button>
                  </div>
                  <Textarea
                    placeholder="Enter your terms and conditions here..."
                    className="min-h-[120px] rounded-t-none"
                    defaultValue={"Use the buttons above to add bullet points or numbered lists.\nEach line will be treated as a separate point."}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Enter notes here..." />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" size="lg" onClick={() => navigate('/quotations')}>Cancel</Button>
                  <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Quotation</Button>
                </div>
              </div>

              <div className="lg:col-span-1 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 h-fit">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Search Quotation #</h3>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Search..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Recent Quotations</h3>
                <p className="text-sm text-slate-500 text-center py-4">No quotations found</p>
              </div>
            </div>
          </form>
        </motion.div>
      );
    };

    export default CreateQuotation;
  