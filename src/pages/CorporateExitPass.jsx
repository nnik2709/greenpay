import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import {
  createCorporateInvoice,
  payInvoice,
  generateVouchersFromInvoice,
  emailVouchersForInvoice,
  downloadInvoicePdf,
  downloadVouchersPdf,
} from '@/lib/corporateVouchersService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import VoucherPrint from '@/components/VoucherPrint';
import CustomerSelector from '@/components/CustomerSelector';

const CorporateExitPass = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: invoice form, 1: invoice created, 2: paid, 3: vouchers generated
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form data
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [totalVouchers, setTotalVouchers] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [validUntil, setValidUntil] = useState('');
  const [applyGst, setApplyGst] = useState(false);

  // Invoice & vouchers
  const [invoice, setInvoice] = useState(null);
  const [generatedVouchers, setGeneratedVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Email vouchers
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Invoice PDF / Vouchers PDF download state (optional UI spinner hooks)
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isDownloadingVouchers, setIsDownloadingVouchers] = useState(false);

  // Prefill recipient email from invoice
  useEffect(() => {
    if (invoice?.customer_email && !recipientEmail) {
      setRecipientEmail(invoice.customer_email);
    }
  }, [invoice, recipientEmail]);

  const voucherValue = 50;
  const totalAmount = totalVouchers * voucherValue;
  const amountAfterDiscount = totalAmount - (totalAmount * (discount / 100));
  const returnedAmount = collectedAmount - amountAfterDiscount;

  useEffect(() => {
    const loadPaymentModes = async () => {
      const modes = await getPaymentModes();
      const activeModes = modes.filter(m => m.active);
      setPaymentModes(activeModes);
      if (activeModes.length > 0) {
        setSelectedMode(activeModes[0].name);
      }
    };
    loadPaymentModes();

    // Set default expiry to 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setValidUntil(defaultExpiry.toISOString().split('T')[0]);
  }, []);

  // Refresh payment modes when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadPaymentModes = async () => {
          const modes = await getPaymentModes();
          const activeModes = modes.filter(m => m.active);
          setPaymentModes(activeModes);
          // Don't change selected mode if user has already selected one
          if (activeModes.length > 0 && !selectedMode) {
            setSelectedMode(activeModes[0].name);
          }
        };
        loadPaymentModes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedMode]);

  useEffect(() => {
    setCollectedAmount(amountAfterDiscount);
  }, [amountAfterDiscount]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast({ variant: "destructive", title: "Customer Required", description: "Please select a customer." });
      return;
    }

    if (totalVouchers < 1) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter at least 1 voucher." });
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.company_name || selectedCustomer.name || companyName.trim(),
        customer_email: selectedCustomer.email,
        customer_phone: selectedCustomer.phone,
        customer_address: selectedCustomer.address_line1,
        customer_tin: selectedCustomer.tin,
        count: totalVouchers,
        amount: voucherValue,
        discount: discount,
        valid_until: validUntil,
        payment_method: selectedMode,
        apply_gst: applyGst
      };

      const response = await createCorporateInvoice(payload);
      if (!response?.invoice) throw new Error('Invoice not returned');
      setInvoice(response.invoice);
      setStep(1);
      toast({
        title: "Invoice Created",
        description: `Invoice ${response.invoice.invoice_number} created. Review and proceed to payment.`,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create invoice: ${error.message || 'Please try again.'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    setIsProcessing(true);
    try {
      const alreadyPaid = parseFloat(invoice.amount_paid || 0);
      const total = parseFloat(invoice.total_amount || 0);
      const remaining = Math.max(total - alreadyPaid, 0);
      const payload = {
        amount: remaining || total,
        payment_method: selectedMode,
        reference_number: `PAY-${Date.now()}`,
        notes: 'Corporate voucher payment'
      };
      const response = await payInvoice(invoice.id, payload);
      setInvoice(response.invoice);
      if (response.invoice.status === 'paid') {
        setStep(2);
      } else {
        setStep(1);
      }
      toast({ title: 'Payment Recorded', description: `Invoice ${response.invoice.invoice_number} marked as ${response.invoice.status}` });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Failed to record payment.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVouchers = async () => {
    if (!invoice) return;
    setIsProcessing(true);
    try {
      const response = await generateVouchersFromInvoice(invoice.id);
      setGeneratedVouchers(response.vouchers || []);
      setStep(3);
      toast({ title: 'Vouchers Generated', description: `${response.vouchers?.length || 0} vouchers created.` });
    } catch (error) {
      console.error('Error generating vouchers:', error);
      toast({ variant: 'destructive', title: 'Generation Error', description: error.message || 'Failed to generate vouchers.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailVouchers = async () => {
    if (!invoice) return;

    if (!recipientEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a recipient email address.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      await emailVouchersForInvoice(invoice.id, recipientEmail.trim());
      toast({
        title: "Email Sent!",
        description: `Vouchers successfully emailed to ${recipientEmail}`,
      });
    } catch (error) {
      console.error('Error emailing vouchers:', error);
      toast({
        variant: "destructive",
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!invoice) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await downloadInvoicePdf(invoice.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      toast({ variant: 'destructive', title: 'Download Error', description: 'Failed to download invoice PDF.' });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleDownloadVouchersPdf = async () => {
    if (!invoice) return;
    setIsDownloadingVouchers(true);
    try {
      const blob = await downloadVouchersPdf(invoice.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vouchers-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading vouchers PDF:', error);
      toast({ variant: 'destructive', title: 'Download Error', description: 'Failed to download vouchers PDF.' });
    } finally {
      setIsDownloadingVouchers(false);
    }
  };

  const handlePrintVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setShowPrintDialog(true);
  };

  const resetForm = () => {
    setStep(0);
    setCompanyName('');
    setTotalVouchers(1);
    setDiscount(0);
    setGeneratedVouchers([]);
    setRecipientEmail('');
    setInvoice(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Corporate Exit Pass
        </h1>
        <Button
          onClick={() => navigate('/app/corporate-batch-history')}
          variant="outline"
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
        >
          Batch History
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  Corporate Vouchers – Create Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateInvoice} className="space-y-6">
                  {/* Customer Selection (same selector as Create Quotation) */}
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <CustomerSelector
                      value={selectedCustomer?.id}
                      onSelect={(customer) => {
                        setSelectedCustomer(customer);
                        setCompanyName(customer?.company_name || customer?.name || '');
                      }}
                      className="mb-4"
                    />
                  </div>

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

                  {/* Amount Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="total_vouchers">Number of Vouchers *</Label>
                      <Input
                        id="total_vouchers"
                        type="number"
                        min="1"
                        value={totalVouchers}
                        onChange={(e) => setTotalVouchers(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_amount">Total Amount (PGK)</Label>
                      <Input id="total_amount" value={totalAmount.toFixed(2)} readOnly className="bg-slate-100 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount_after_discount">Amount After Discount</Label>
                      <Input id="amount_after_discount" value={amountAfterDiscount.toFixed(2)} readOnly className="bg-slate-100 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collected_amount">Collected Amount (PGK)</Label>
                      <Input
                        id="collected_amount"
                        type="number"
                        value={collectedAmount}
                        onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returned_amount">Change/Returned Amount</Label>
                      <Input id="returned_amount" value={returnedAmount > 0 ? returnedAmount.toFixed(2) : '0.00'} readOnly className="bg-slate-100" />
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* GST Toggle */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="gst-toggle" className="text-sm font-semibold text-slate-900">
                          Apply GST (10%)
                        </Label>
                        <p className="text-xs text-slate-600 mt-1">
                          Toggle to include or exclude GST on this invoice (default: OFF)
                        </p>
                      </div>
                      <Switch
                        id="gst-toggle"
                        checked={applyGst}
                        onCheckedChange={setApplyGst}
                      />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Intended Payment Method *</Label>
                    <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {paymentModes.map(mode => (
                        <div key={mode.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                          <RadioGroupItem value={mode.name} id={`corp-${mode.name}`} />
                          <Label htmlFor={`corp-${mode.name}`} className="font-normal cursor-pointer flex-1">{mode.name}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600"
                    >
                      {isProcessing ? 'Creating...' : 'Create Invoice'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 1 && invoice && (
          <motion.div
            key="invoice"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-700">Invoice Created</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Company:</span>
                    <p className="font-semibold">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Invoice #:</span>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Amount:</span>
                    <p className="font-semibold">PGK {parseFloat(invoice.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>
                    <p className="font-semibold uppercase">{invoice.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Amount Due:</span>
                    <p className="font-semibold">PGK {parseFloat(invoice.amount_due || invoice.total_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button variant="outline" onClick={handleDownloadInvoicePdf} disabled={isDownloadingInvoice}>
                    {isDownloadingInvoice ? 'Downloading...' : 'Download Invoice PDF'}
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Print invoice', description: 'Download then print via your viewer.' })}>
                    Print Invoice
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Email invoice', description: 'Use the invoices page to email invoice (existing flow).' })}>
                    Email Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="bg-amber-50">
                <CardTitle className="text-amber-700">Step 2: Record Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">
                  Confirm payment to mark the invoice as paid. Amount due: <strong>PGK {parseFloat(invoice.amount_due || invoice.total_amount).toFixed(2)}</strong>
                </p>
                <Button disabled={isProcessing} onClick={handlePayInvoice} className="bg-amber-500 hover:bg-amber-600">
                  {isProcessing ? 'Recording...' : 'Mark as Paid'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && invoice && (
          <motion.div
            key="paid"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="text-emerald-700">Invoice Paid</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-slate-700">Invoice {invoice.invoice_number} is marked as {invoice.status}. You can now generate vouchers.</p>
                <Button
                  disabled={isProcessing || invoice.status !== 'paid'}
                  onClick={handleGenerateVouchers}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? 'Generating...' : 'Generate Vouchers'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && invoice && (
          <motion.div
            key="vouchers"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-700">
                  Vouchers Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Company:</span>
                    <p className="font-semibold">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Invoice #:</span>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Vouchers:</span>
                    <p className="font-semibold">{generatedVouchers.length}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Amount:</span>
                    <p className="font-semibold">PGK {parseFloat(invoice.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleDownloadVouchersPdf} disabled={isDownloadingVouchers}>
                    {isDownloadingVouchers ? 'Downloading...' : 'Download Vouchers PDF'}
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Print vouchers', description: 'Download then print via your viewer.' })}>
                    Print Vouchers
                  </Button>
                </div>

                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-blue-700">Bulk Email Vouchers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="recipient_email">Recipient Email</Label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        id="recipient_email"
                        type="email"
                        placeholder="customer@company.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleEmailVouchers} disabled={isSendingEmail}>
                        {isSendingEmail ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Uses corporate voucher template and single PDF attachment.</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedVouchers.map((voucher) => (
                    <div key={voucher.id} className="border rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-emerald-700">{voucher.voucher_code}</p>
                          <p className="text-sm text-slate-600">PGK {voucher.amount} • Valid until {new Date(voucher.valid_until).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handlePrintVoucher(voucher)}>
                          Print
                        </Button>
                      </div>
                      <div className="text-xs text-slate-500">
                        Status: {voucher.status}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button variant="secondary" onClick={resetForm}>Create Another</Button>
                  <Button variant="outline" onClick={() => navigate('/app/vouchers-list')}>Go to Vouchers List</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Dialog */}
      {selectedVoucher && (
        <VoucherPrint
          voucher={selectedVoucher}
          isOpen={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedVoucher(null);
          }}
          voucherType="Corporate"
        />
      )}
    </motion.div>
  );
};

export default CorporateExitPass;
