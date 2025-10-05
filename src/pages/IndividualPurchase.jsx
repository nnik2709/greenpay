import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanLine, User, Globe, Calendar, VenetianMask, Hash, Upload, ArrowRight, ArrowLeft, Check, DollarSign, Ticket, CreditCard, Shield, QrCode, Printer, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { passports as mockPassports } from '@/lib/passportData';
import { getPassportByNumber, createPassport } from '@/lib/passportsService';
import { createIndividualPurchase } from '@/lib/individualPurchasesService';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { name: 'Passport Details', icon: <User /> },
    { name: 'Payment', icon: <DollarSign /> },
    { name: 'Voucher', icon: <Ticket /> },
  ];

  return (
    <div className="flex justify-center items-center mb-12">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: currentStep === index ? 1.1 : 1,
                backgroundColor: currentStep >= index ? '#10b981' : '#e2e8f0',
                color: currentStep >= index ? '#ffffff' : '#64748b',
              }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            >
              {currentStep > index ? <Check /> : step.icon}
            </motion.div>
            <p className={`mt-2 text-sm font-medium ${currentStep >= index ? 'text-emerald-600' : 'text-slate-500'}`}>
              {step.name}
            </p>
          </div>
          {index < steps.length - 1 && (
            <motion.div
              className="flex-1 h-1 mx-4 bg-slate-200"
              initial={false}
              animate={{
                background: `linear-gradient(to right, #10b981 ${currentStep > index ? 100 : 0}%, #e2e8f0 ${currentStep > index ? 100 : 0}%)`
              }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const PassportDetailsStep = ({ onNext, setPassportInfo, passportInfo }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({ variant: "destructive", title: "Search is empty", description: "Please enter a passport number." });
      return;
    }
    const result = mockPassports.find(p => p.passportNumber.toLowerCase() === searchQuery.toLowerCase());
    if (result) {
      setSearchResult(result);
      setPassportInfo(result);
      toast({ title: "Passport Found", description: `${result.givenName} ${result.surname}'s details have been loaded.` });
    } else {
      setSearchResult(null);
      toast({ variant: "destructive", title: "Not Found", description: "No passport found with that number." });
    }
  };

  const handleScan = useCallback((value) => {
    const result = mockPassports.find(p => p.passportNumber.toLowerCase() === value.toLowerCase());
    if (result) {
      setSearchResult(result);
      setPassportInfo(result);
      setSearchQuery(result.passportNumber);
      toast({ title: "Passport Scanned & Found", description: `${result.givenName} ${result.surname}'s details have been loaded.` });
    } else {
      toast({ variant: "destructive", title: "Scan Failed", description: "No passport found for the scanned code." });
    }
    setScanInput('');
  }, [setPassportInfo, toast]);

  useEffect(() => {
    const handlePaste = (event) => {
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      if (paste.length > 5) { // Simple check for barcode scanner input
        setScanInput(paste.trim());
        handleScan(paste.trim());
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleScan]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassportInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setPassportInfo(prev => ({ ...prev, sex: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setPassportInfo(prev => ({ ...prev, [name]: files[0].name }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Find or Create Passport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="font-semibold text-slate-700">Search Passport</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Enter Passport Number"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto">Search</Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or Scan with KB Scanner</span>
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-700">Scan Passport</label>
            <div className="relative mt-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Ready to scan... (or paste here)"
                className="pl-10"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onBlur={() => scanInput && handleScan(scanInput)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Passport Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="passportNumber">Passport Number</label>
              <div className="relative mt-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input id="passportNumber" name="passportNumber" placeholder="e.g., P1234567" className="pl-9" value={passportInfo.passportNumber || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label htmlFor="nationality">Nationality</label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input id="nationality" name="nationality" placeholder="e.g., Australian" className="pl-9" value={passportInfo.nationality || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label htmlFor="surname">Surname</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input id="surname" name="surname" placeholder="e.g., Smith" className="pl-9" value={passportInfo.surname || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label htmlFor="givenName">Given Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input id="givenName" name="givenName" placeholder="e.g., John" className="pl-9" value={passportInfo.givenName || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label htmlFor="dob">Date of Birth</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input id="dob" name="dob" type="date" placeholder="dd/mm/yyyy" className="pl-9" value={passportInfo.dob || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label htmlFor="sex">Sex</label>
              <Select name="sex" onValueChange={handleSelectChange} value={passportInfo.sex || ''}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Passport Photo</label>
              <div className="mt-1 flex items-center gap-3 rounded-lg border p-3">
                <Button type="button" variant="outline" onClick={() => document.getElementById('passportPhoto').click()}>
                  <Upload className="w-4 h-4 mr-2" /> Choose file
                </Button>
                <Input id="passportPhoto" name="passportPhoto" type="file" className="hidden" onChange={handleFileChange} />
                <span className="text-sm text-slate-500">{passportInfo.passportPhoto || 'No file chosen'}</span>
              </div>
            </div>
            <div>
              <label>Signature Image</label>
              <div className="mt-1 flex items-center gap-3 rounded-lg border p-3">
                <Button type="button" variant="outline" onClick={() => document.getElementById('signatureImage').click()}>
                  <Upload className="w-4 h-4 mr-2" /> Choose file
                </Button>
                <Input id="signatureImage" name="signatureImage" type="file" className="hidden" onChange={handleFileChange} />
                <span className="text-sm text-slate-500">{passportInfo.signatureImage || 'No file chosen'}</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-8">
        <Button onClick={onNext} size="lg">
          Proceed to Payment <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

const PaymentStep = ({ onNext, onBack, passportInfo, setPaymentData }) => {
  const { toast } = useToast();
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [amount, setAmount] = useState(50);
  const [discount, setDiscount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
  }, []);

  const amountAfterDiscount = amount - (amount * (discount / 100));
  const returnedAmount = collectedAmount - amountAfterDiscount;
  const selectedModeObj = paymentModes.find(m => m.name === selectedMode);
  const requiresCardDetails = selectedModeObj?.collectCardDetails;

  const handleProceed = async () => {
    if (!selectedMode) {
      toast({ variant: "destructive", title: "No Payment Mode", description: "Please select a payment mode." });
      return;
    }

    if (collectedAmount < amountAfterDiscount) {
      toast({ variant: "destructive", title: "Insufficient Amount", description: "Collected amount is less than the total." });
      return;
    }

    if (requiresCardDetails && (!cardNumber || !expiry || !cvc)) {
      toast({ variant: "destructive", title: "Card Details Required", description: "Please enter all card details." });
      return;
    }

    setIsProcessing(true);

    // Store payment data
    setPaymentData({
      paymentMethod: selectedMode,
      amount: amountAfterDiscount,
      discount,
      collectedAmount,
      returnedAmount: returnedAmount > 0 ? returnedAmount : 0,
      cardLastFour: requiresCardDetails ? cardNumber.slice(-4) : null,
    });

    toast({ title: "Payment Accepted", description: `Payment of PGK ${amountAfterDiscount.toFixed(2)} processed successfully.` });

    setTimeout(() => {
      setIsProcessing(false);
      onNext();
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Amount (PGK)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Amount After Discount</Label>
              <Input value={amountAfterDiscount.toFixed(2)} readOnly className="bg-slate-100 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Collected Amount (PGK)</Label>
              <Input type="number" value={collectedAmount} onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Change/Returned Amount</Label>
              <Input value={returnedAmount > 0 ? returnedAmount.toFixed(2) : '0.00'} readOnly className="bg-slate-100" />
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentModes.map(mode => (
                <div key={mode.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value={mode.name} id={mode.name} />
                  <Label htmlFor={mode.name} className="font-normal cursor-pointer flex-1">{mode.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Card Details (if required) */}
          {requiresCardDetails && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-slate-700">Card Information</h3>
              <div className="space-y-2">
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input placeholder="0000 0000 0000 0000" className="pl-10" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input placeholder="MM/YY" className="pl-10" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input placeholder="123" className="pl-10" value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} type="password" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg" disabled={isProcessing}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button onClick={handleProceed} size="lg" disabled={isProcessing} className="bg-gradient-to-r from-emerald-500 to-teal-600">
          {isProcessing ? 'Processing...' : 'Process Payment'} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

const VoucherStep = ({ onBack, passportInfo, paymentData, voucher }) => {
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  if (!voucher) {
    return (
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">Generating voucher...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card className="border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="w-6 h-6" />
            Voucher Generated Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              Exit pass voucher has been created for {passportInfo.givenName} {passportInfo.surname}
            </p>
          </div>

          {/* Voucher Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Passport Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Passport Number:</span>
                  <span className="font-semibold">{voucher.passport_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-semibold">{passportInfo.givenName} {passportInfo.surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nationality:</span>
                  <span className="font-semibold">{passportInfo.nationality}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Voucher Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Voucher Code:</span>
                  <span className="font-mono font-bold text-green-600">{voucher.voucher_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold">PGK {voucher.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-semibold">{voucher.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="font-semibold">{new Date(voucher.valid_until).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={() => setShowPrintDialog(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Printer className="w-4 h-4 mr-2" />
              Print Voucher
            </Button>
            <Button variant="outline" className="flex-1">
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-5 h-5" /> Create Another
        </Button>
        <Button onClick={() => window.location.href = '/'} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600">
          <Check className="mr-2 w-5 h-5" /> Done
        </Button>
      </div>

      {/* Print Dialog */}
      <VoucherPrint
        voucher={voucher}
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        voucherType="Individual"
      />
    </motion.div>
  );
};

const IndividualPurchase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [passportInfo, setPassportInfo] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  // Generate voucher when moving to step 2
  useEffect(() => {
    if (step === 2 && paymentData && !voucher && !isCreatingVoucher) {
      createVoucherAndPassport();
    }
  }, [step, paymentData, voucher, isCreatingVoucher]);

  const createVoucherAndPassport = async () => {
    setIsCreatingVoucher(true);
    try {
      // First, check if passport exists or create it
      let passport = await getPassportByNumber(passportInfo.passportNumber);

      if (!passport) {
        // Create passport if it doesn't exist
        passport = await createPassport({
          passportNumber: passportInfo.passportNumber,
          nationality: passportInfo.nationality,
          surname: passportInfo.surname,
          givenName: passportInfo.givenName,
          dob: passportInfo.dob,
          sex: passportInfo.sex,
          dateOfExpiry: passportInfo.dateOfExpiry,
        }, user?.id);
      }

      // Create individual purchase voucher
      const purchaseData = {
        passportId: passport.id,
        passportNumber: passport.passport_number,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        cardLastFour: paymentData.cardLastFour,
        nationality: passport.nationality,
      };

      const createdVoucher = await createIndividualPurchase(purchaseData, user?.id);
      setVoucher(createdVoucher);

      toast({
        title: "Success!",
        description: "Voucher generated successfully.",
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate voucher. Please try again.",
      });
      setStep(1); // Go back to payment step
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setPassportInfo({});
    setPaymentData(null);
    setVoucher(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <StepIndicator currentStep={step} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <PassportDetailsStep
            key="step0"
            onNext={handleNext}
            setPassportInfo={setPassportInfo}
            passportInfo={passportInfo}
          />
        )}
        {step === 1 && (
          <PaymentStep
            key="step1"
            onNext={handleNext}
            onBack={handleBack}
            passportInfo={passportInfo}
            setPaymentData={setPaymentData}
          />
        )}
        {step === 2 && (
          <VoucherStep
            key="step2"
            onBack={resetFlow}
            passportInfo={passportInfo}
            paymentData={paymentData}
            voucher={voucher}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndividualPurchase;
