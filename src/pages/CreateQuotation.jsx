import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { createQuotation, updateQuotation } from '@/lib/quotationsService';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSelector from '@/components/CustomerSelector';
import api from '@/lib/api/client';

const CreateQuotation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams(); // Get quotation ID from route params
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit mode flag
  const isEditMode = !!id;

  // Calculate default validity date (7 days from today)
  const getDefaultValidityDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [totalVouchers, setTotalVouchers] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState(getDefaultValidityDate());
  const [notes, setNotes] = useState('');
  const [applyGst, setApplyGst] = useState(false); // Default: no GST

  // Load quotation data in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadQuotationData();
    }
  }, [id]);

  const loadQuotationData = async () => {
    try {
      setIsLoading(true);
      const response = await api.quotations.getById(id);
      const quotation = response.data;

      // Pre-populate form with quotation data
      setTotalVouchers(quotation.number_of_vouchers || 1);
      setDiscount(quotation.discount_percentage || 0);
      setValidUntil(quotation.valid_until ? quotation.valid_until.split('T')[0] : '');
      setNotes(quotation.notes || '');
      setApplyGst(quotation.gst_rate > 0 || quotation.gst_amount > 0); // Set based on existing GST

      // Set customer data
      setSelectedCustomer({
        id: quotation.id,
        name: quotation.customer_name || quotation.company_name,
        company_name: quotation.customer_name || quotation.company_name,
        email: quotation.customer_email || quotation.contact_email,
        phone: quotation.customer_phone || quotation.contact_phone,
      });
    } catch (error) {
      console.error('Error loading quotation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load quotation data'
      });
      navigate('/app/quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const voucherValue = 50; // Price per passport/voucher
  const gstRate = 10.0; // PNG GST rate

  const totalAmount = totalVouchers * voucherValue;
  const discountAmount = totalAmount * (discount / 100);
  const amountAfterDiscount = totalAmount - discountAmount;
  const gstAmount = applyGst ? amountAfterDiscount * (gstRate / 100) : 0;
  const finalTotal = amountAfterDiscount + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please select a customer.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const quotationData = {
        companyName: selectedCustomer.company_name || selectedCustomer.name,
        contactPerson: selectedCustomer.contact_person || selectedCustomer.name,
        contactEmail: selectedCustomer.email,
        contactPhone: selectedCustomer.phone,
        numberOfPassports: totalVouchers,
        amountPerPassport: voucherValue,
        discount: discount,
        discountAmount: discountAmount,
        amountAfterDiscount: amountAfterDiscount,
        applyGst: applyGst,
        gstRate: applyGst ? gstRate : 0,
        gstAmount: gstAmount,
        totalAmount: finalTotal,
        validUntil: validUntil,
        notes: notes,
      };

      let result;
      if (isEditMode) {
        result = await updateQuotation(id, quotationData, user?.id);
        toast({
          title: "Quotation Updated!",
          description: `Quotation has been updated successfully.`,
        });
      } else {
        result = await createQuotation(quotationData, user?.id);
        toast({
          title: "Quotation Created!",
          description: `Quotation ${result.quotation_number || 'N/A'} has been saved successfully.`,
        });
      }

      if (!result) {
        throw new Error('No data returned from server');
      }

      // Navigate back to quotations list
      navigate('/app/quotations');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} quotation:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} quotation: ${error.message || 'Please try again.'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        {isEditMode ? 'Edit Quotation' : 'Create New Quotation'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100 space-y-6">
            <CustomerSelector
              value={selectedCustomer?.id}
              onSelect={setSelectedCustomer}
              className="mb-6"
            />

            {selectedCustomer && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-2">Selected Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-emerald-700 font-medium">Name:</span>{' '}
                    <span className="text-emerald-900">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.company_name && (
                    <div>
                      <span className="text-emerald-700 font-medium">Company:</span>{' '}
                      <span className="text-emerald-900">{selectedCustomer.company_name}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div>
                      <span className="text-emerald-700 font-medium">Email:</span>{' '}
                      <span className="text-emerald-900">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div>
                      <span className="text-emerald-700 font-medium">Phone:</span>{' '}
                      <span className="text-emerald-900">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.address_line1 && (
                    <div className="md:col-span-2">
                      <span className="text-emerald-700 font-medium">Address:</span>{' '}
                      <span className="text-emerald-900">
                        {selectedCustomer.address_line1}
                        {selectedCustomer.address_line2 && `, ${selectedCustomer.address_line2}`}
                        {selectedCustomer.city && `, ${selectedCustomer.city}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <Label htmlFor="valid_until">Valid Until (Default: 7 days)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="7 days from today"
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
                <Label htmlFor="amount_after_discount">Subtotal (After Discount)</Label>
                <Input
                  id="amount_after_discount"
                  value={`PGK ${amountAfterDiscount.toFixed(2)}`}
                  readOnly
                  className="bg-slate-100"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <Label htmlFor="apply_gst" className="text-base font-semibold">Apply GST (10%)</Label>
                  <p className="text-sm text-slate-600">Add Goods and Services Tax to the quotation</p>
                </div>
                <Switch
                  id="apply_gst"
                  checked={applyGst}
                  onCheckedChange={setApplyGst}
                />
              </div>

              {applyGst && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst_amount">GST Amount (10%)</Label>
                    <Input
                      id="gst_amount"
                      value={`PGK ${gstAmount.toFixed(2)}`}
                      readOnly
                      className="bg-emerald-50 text-emerald-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="final_total" className="font-bold">Final Total (Inc. GST)</Label>
                    <Input
                      id="final_total"
                      value={`PGK ${finalTotal.toFixed(2)}`}
                      readOnly
                      className="bg-emerald-100 text-emerald-900 font-bold text-lg"
                    />
                  </div>
                </div>
              )}

              {!applyGst && (
                <div className="space-y-2">
                  <Label htmlFor="final_total_no_gst" className="font-bold">Final Total</Label>
                  <Input
                    id="final_total_no_gst"
                    value={`PGK ${finalTotal.toFixed(2)}`}
                    readOnly
                    className="bg-slate-100 font-bold text-lg"
                  />
                </div>
              )}
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
                onClick={() => navigate('/app/quotations')}
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
                {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Quotation' : 'Create Quotation')}
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
                <p className="text-blue-700">Subtotal: PGK {amountAfterDiscount.toFixed(2)}</p>
                {applyGst && (
                  <>
                    <p className="text-blue-700">GST (10%): PGK {gstAmount.toFixed(2)}</p>
                    <p className="text-blue-900 font-bold">Total: PGK {finalTotal.toFixed(2)}</p>
                  </>
                )}
                {!applyGst && (
                  <p className="text-blue-900 font-bold">Total: PGK {finalTotal.toFixed(2)}</p>
                )}
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
