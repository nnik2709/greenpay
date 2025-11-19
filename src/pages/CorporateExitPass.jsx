import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, QrCode, Check, Loader2, Building, Calendar, DollarSign, Hash, History } from 'lucide-react';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import { createBulkCorporateVouchers } from '@/lib/corporateVouchersService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import VoucherPrint from '@/components/VoucherPrint';

const CorporateExitPass = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = form, 1 = generated list
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form data
  const [companyName, setCompanyName] = useState('');
  const [totalVouchers, setTotalVouchers] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [validUntil, setValidUntil] = useState('');

  // Generated vouchers
  const [generatedVouchers, setGeneratedVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

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

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast({ variant: "destructive", title: "Company Name Required", description: "Please enter a company name." });
      return;
    }

    if (totalVouchers < 1) {
      toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter at least 1 voucher." });
      return;
    }

    if (collectedAmount < amountAfterDiscount) {
      toast({ variant: "destructive", title: "Insufficient Amount", description: "Collected amount is less than the total." });
      return;
    }

    setIsProcessing(true);

    try {
      const bulkData = {
        companyName: companyName.trim(),
        count: totalVouchers,
        // per-voucher amount; using voucherValue (unit price) rather than total
        amount: voucherValue,
        paymentMethod: selectedMode,
        validFrom: new Date().toISOString(),
        validUntil: new Date(validUntil).toISOString(),
      };

      const vouchers = await createBulkCorporateVouchers(bulkData);
      setGeneratedVouchers(vouchers);
      setStep(1);

      toast({
        title: "Success!",
        description: `${totalVouchers} corporate vouchers generated successfully.`,
      });
    } catch (error) {
      console.error('Error generating vouchers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate vouchers: ${error.message || 'Please try again.'}`,
      });
    } finally {
      setIsProcessing(false);
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
          onClick={() => navigate('/corporate-batch-history')} 
          variant="outline" 
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
        >
          <History className="w-4 h-4 mr-2" />
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
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-6 h-6" />
                  Bulk Voucher Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

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

                  {/* Payment Mode */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Payment Method *</Label>
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
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Generate Vouchers
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            {/* Success Summary */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Check className="w-6 h-6" />
                  Vouchers Generated Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Company:</span>
                    <p className="font-semibold">{companyName}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Vouchers:</span>
                    <p className="font-semibold">{generatedVouchers.length}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Amount:</span>
                    <p className="font-semibold">PGK {amountAfterDiscount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Valid Until:</span>
                    <p className="font-semibold">{new Date(validUntil).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vouchers List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Generated Vouchers</span>
                  <Button variant="outline" onClick={resetForm}>
                    Create Another Batch
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedVouchers.map((voucher, index) => (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3 bg-emerald-50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Voucher #{index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm p-4">
                          <div>
                            <span className="text-slate-600">Code:</span>
                            <p className="font-mono font-bold text-emerald-600 break-all">{voucher.voucher_code}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Amount:</span>
                            <p className="font-semibold">PGK {voucher.amount}</p>
                          </div>
                          <div>
                            <span className="text-slate-600">Status:</span>
                            <p className="font-semibold text-green-600">Valid</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePrintVoucher(voucher)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Voucher
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
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
