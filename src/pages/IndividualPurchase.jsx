import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanLine, User, Globe, Calendar, VenetianMask, Hash, Upload, ArrowRight, ArrowLeft, Check, DollarSign, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { passports as mockPassports } from '@/lib/passportData';

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
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

const PaymentStep = ({ onNext, onBack }) => (
  <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-16">
        <h2 className="text-2xl font-semibold text-slate-700">Payment Section</h2>
        <p className="text-slate-500 mt-2">This feature is under construction.</p>
      </CardContent>
    </Card>
    <div className="flex justify-between mt-8">
      <Button onClick={onBack} variant="outline" size="lg">
        <ArrowLeft className="mr-2 w-5 h-5" /> Back
      </Button>
      <Button onClick={onNext} size="lg">
        Generate Voucher <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  </motion.div>
);

const VoucherStep = ({ onBack }) => (
  <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
    <Card>
      <CardHeader>
        <CardTitle>Voucher Generation</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-16">
        <h2 className="text-2xl font-semibold text-slate-700">Voucher Section</h2>
        <p className="text-slate-500 mt-2">This feature is under construction.</p>
      </CardContent>
    </Card>
    <div className="flex justify-start mt-8">
      <Button onClick={onBack} variant="outline" size="lg">
        <ArrowLeft className="mr-2 w-5 h-5" /> Back
      </Button>
    </div>
  </motion.div>
);

const IndividualPurchase = () => {
  const [step, setStep] = useState(0);
  const [passportInfo, setPassportInfo] = useState({});

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <StepIndicator currentStep={step} />
      <AnimatePresence mode="wait">
        {step === 0 && <PassportDetailsStep key="step0" onNext={handleNext} setPassportInfo={setPassportInfo} passportInfo={passportInfo} />}
        {step === 1 && <PaymentStep key="step1" onNext={handleNext} onBack={handleBack} />}
        {step === 2 && <VoucherStep key="step2" onBack={handleBack} />}
      </AnimatePresence>
    </div>
  );
};

export default IndividualPurchase;
