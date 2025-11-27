import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { createQuotation } from '@/lib/quotationsService';
import { useAuth } from '@/contexts/AuthContext';

const CreateQuotation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [totalVouchers, setTotalVouchers] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  const voucherValue = 50; // Price per passport/voucher

  const totalAmount = totalVouchers * voucherValue;
  const discountAmount = totalAmount * (discount / 100);
  const amountAfterDiscount = totalAmount - discountAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !contactPerson || !contactEmail || !validUntil) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const quotationData = {
        companyName: companyName,
        contactPerson: contactPerson,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        numberOfPassports: totalVouchers,
        amountPerPassport: voucherValue,
        discount: discount,
        discountAmount: discountAmount,
        amountAfterDiscount: amountAfterDiscount,
        validUntil: validUntil,
        notes: notes,
      };

      const result = await createQuotation(quotationData, user?.id);

      if (!result) {
        throw new Error('No data returned from server');
      }

      toast({
        title: "Quotation Created!",
        description: `Quotation ${result.quotation_number || 'N/A'} has been saved successfully.`,
      });

      // Navigate back to quotations list
      navigate('/quotations');
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create quotation: ${error.message || 'Please try again.'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  placeholder="Enter contact person"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+675..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total_vouchers">Total Vouchers *</Label>
                <Input
                  id="total_vouchers"
                  type="number"
                  min="1"
                  value={totalVouchers}
                  onChange={(e) => setTotalVouchers(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher_value">Voucher Value (PGK) *</Label>
                <Input
                  id="voucher_value"
                  value={voucherValue.toFixed(2)}
                  readOnly
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  value={`PGK ${totalAmount.toFixed(2)}`}
                  readOnly
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Discount Amount</Label>
                <Input
                  id="discount_amount"
                  value={`PGK ${discountAmount.toFixed(2)}`}
                  readOnly
                  className="bg-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_after_discount">Amount After Discount</Label>
                <Input
                  id="amount_after_discount"
                  value={`PGK ${amountAfterDiscount.toFixed(2)}`}
                  readOnly
                  className="bg-slate-100 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes or terms & conditions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/quotations')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Quotation'}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 h-fit">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Reference</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="font-medium text-emerald-900">Standard Rate</p>
                <p className="text-emerald-700">PGK {voucherValue.toFixed(2)} per voucher</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">Current Quote</p>
                <p className="text-blue-700">{totalVouchers} vouchers</p>
                <p className="text-blue-700">PGK {amountAfterDiscount.toFixed(2)} total</p>
              </div>
              {discount > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="font-medium text-amber-900">Discount Applied</p>
                  <p className="text-amber-700">{discount}% discount</p>
                  <p className="text-amber-700">Saving PGK {discountAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateQuotation;
