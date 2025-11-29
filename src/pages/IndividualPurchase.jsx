import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLocation } from 'react-router-dom';
// Legacy import removed - using Supabase passportsService instead
import { getPassportByNumber, createPassport, searchPassports } from '@/lib/passportsService';
import { createIndividualPurchase } from '@/lib/individualPurchasesService';
import { getPaymentModes } from '@/lib/paymentModesStorage';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';
import { processOnlinePayment, isGatewayActive, GATEWAY_NAMES } from '@/lib/paymentGatewayService';
import { useScannerInput } from '@/hooks/useScannerInput';
import LiveMRZScanner from '@/components/LiveMRZScanner';
import { Camera } from 'lucide-react';

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { name: 'Passport Details' },
    { name: 'Payment' },
    { name: 'Voucher' },
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
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
            >
              {currentStep > index ? '✓' : index + 1}
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
  const [showOCRScanner, setShowOCRScanner] = useState(false);

  // Hardware scanner support with MRZ parsing
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: async (data) => {
      if (data.type === 'mrz') {
        // MRZ passport scan - auto-fill all fields
        const passportData = {
          passportNumber: data.passportNumber,
          surname: data.surname,
          givenName: data.givenName,
          nationality: data.nationality,
          dob: data.dob,
          sex: data.sex,
          dateOfExpiry: data.dateOfExpiry,
        };

        // Check if passport exists in database
        try {
          const existingPassport = await getPassportByNumber(data.passportNumber);
          if (existingPassport) {
            // Passport exists - load full record
            const fullPassportData = {
              id: existingPassport.id,
              passportNumber: existingPassport.passport_number,
              nationality: existingPassport.nationality,
              surname: existingPassport.surname,
              givenName: existingPassport.given_name,
              dob: existingPassport.dob,
              sex: existingPassport.sex,
              dateOfExpiry: existingPassport.date_of_expiry,
              passportPhoto: existingPassport.passport_photo,
              signatureImage: existingPassport.signature_image,
            };
            setSearchResult(fullPassportData);
            setPassportInfo(fullPassportData);
            setSearchQuery(fullPassportData.passportNumber);
            toast({
              title: "MRZ Scanned - Passport Found",
              description: `${fullPassportData.givenName} ${fullPassportData.surname}'s details have been loaded from database.`
            });
          } else {
            // New passport - use MRZ data
            setPassportInfo(passportData);
            setSearchQuery(data.passportNumber);
            toast({
              title: "MRZ Scanned - New Passport",
              description: "Passport details auto-filled from MRZ. Please verify and add photo if needed."
            });
          }
        } catch (error) {
          // Error checking database, still use MRZ data
          setPassportInfo(passportData);
          setSearchQuery(data.passportNumber);
          toast({
            title: "MRZ Scanned",
            description: "Passport details auto-filled. Please verify information."
          });
        }
      } else {
        // Simple barcode/passport number scan
        handleScan(data.value);
      }
    },
    onScanError: (error) => {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to process scan. Please try again.",
        variant: "destructive"
      });
    },
    minLength: 5,
    scanTimeout: 100,
    enableMrzParsing: true,
    debugMode: false
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ variant: "destructive", title: "Search is empty", description: "Please enter a passport number." });
      return;
    }
    try {
      const result = await getPassportByNumber(searchQuery.trim());
      if (result) {
        // Map database fields to component state format
        const passportData = {
          id: result.id,
          passportNumber: result.passport_number,
          nationality: result.nationality,
          surname: result.surname,
          givenName: result.given_name,
          dob: result.dob,
          sex: result.sex,
          dateOfExpiry: result.date_of_expiry,
        };
        setSearchResult(passportData);
        setPassportInfo(passportData);
        toast({ title: "Passport Found", description: `${passportData.givenName} ${passportData.surname}'s details have been loaded.` });
      } else {
        setSearchResult(null);
        toast({ variant: "destructive", title: "Not Found", description: "No passport found with that number. You can enter the details manually." });
      }
    } catch (error) {
      console.error('Error searching passport:', error);
      setSearchResult(null);
      toast({ variant: "destructive", title: "Search Error", description: "Failed to search for passport. Please try again." });
    }
  };

  const handleScan = useCallback(async (value) => {
    try {
      const result = await getPassportByNumber(value.trim());
      if (result) {
        // Map database fields to component state format
        const passportData = {
          id: result.id,
          passportNumber: result.passport_number,
          nationality: result.nationality,
          surname: result.surname,
          givenName: result.given_name,
          dob: result.dob,
          sex: result.sex,
          dateOfExpiry: result.date_of_expiry,
        };
        setSearchResult(passportData);
        setPassportInfo(passportData);
        setSearchQuery(passportData.passportNumber);
        toast({ title: "Passport Scanned & Found", description: `${passportData.givenName} ${passportData.surname}'s details have been loaded.` });
      } else {
        // Set the scanned passport number for manual entry
        setSearchQuery(value.trim());
        setPassportInfo(prev => ({ ...prev, passportNumber: value.trim() }));
        toast({ variant: "default", title: "New Passport", description: "Passport not found in system. Please enter details manually." });
      }
    } catch (error) {
      console.error('Error scanning passport:', error);
      toast({ variant: "destructive", title: "Scan Error", description: "Failed to search for passport. Please try again." });
    }
    setScanInput('');
  }, [setPassportInfo, toast]);

  // Old paste event listener removed - now using useScannerInput hook above

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
              <Input
                placeholder="Enter Passport Number"
                className="mt-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto">Search</Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or Scan with Hardware Scanner</span>
            </div>
          </div>
          {isScannerActive && (
            <Card className="bg-emerald-50 border-emerald-300">
              <CardContent className="p-4">
                <div>
                  <h3 className="font-bold text-emerald-900">Scanning...</h3>
                  <p className="text-emerald-700 text-sm">
                    Please scan passport MRZ (2 lines at bottom) or passport number barcode.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {!isScannerActive && (
            <Card className="bg-blue-50 border-blue-300">
              <CardContent className="p-4">
                <div>
                  <h3 className="font-bold text-blue-900">Ready for Hardware Scanner</h3>
                  <p className="text-blue-700 text-sm">
                    Use your USB/Bluetooth scanner to scan passport MRZ or barcode. The system will auto-detect and fill the form.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Camera OCR Scanner - Backup Option */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or Use Camera (If Hardware Scanner Fails)</span>
            </div>
          </div>

          <Button
            onClick={() => setShowOCRScanner(true)}
            variant="outline"
            className="w-full h-16 text-lg border-2 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400"
          >
            <Camera className="w-6 h-6 mr-3 text-indigo-600" />
            <div className="text-left">
              <div className="font-bold text-indigo-900">📹 Live Camera Scanner (Auto-Detect MRZ)</div>
              <div className="text-xs text-indigo-600">Backup option - Real-time OCR with auto-capture</div>
            </div>
          </Button>

          {/* Live MRZ Scanner Dialog */}
          <Dialog open={showOCRScanner} onOpenChange={setShowOCRScanner}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Camera className="w-6 h-6" />
                  Live MRZ Scanner - Auto-Detect & Capture
                </DialogTitle>
              </DialogHeader>
              <LiveMRZScanner
                onScanSuccess={async (data) => {
                  // Same logic as hardware scanner
                  const passportData = {
                    passportNumber: data.passportNumber,
                    surname: data.surname,
                    givenName: data.givenName,
                    nationality: data.nationality,
                    dob: data.dob,
                    sex: data.sex,
                    dateOfExpiry: data.dateOfExpiry,
                  };

                  // Check if passport exists in database
                  try {
                    const existingPassport = await getPassportByNumber(data.passportNumber);
                    if (existingPassport) {
                      // Passport exists - load full record
                      const fullPassportData = {
                        id: existingPassport.id,
                        passportNumber: existingPassport.passport_number,
                        nationality: existingPassport.nationality,
                        surname: existingPassport.surname,
                        givenName: existingPassport.given_name,
                        dob: existingPassport.dob,
                        sex: existingPassport.sex,
                        dateOfExpiry: existingPassport.date_of_expiry,
                      };
                      setSearchResult(fullPassportData);
                      setPassportInfo(fullPassportData);
                      setSearchQuery(fullPassportData.passportNumber);
                      toast({
                        title: "Camera OCR - Passport Found",
                        description: `${fullPassportData.givenName} ${fullPassportData.surname}'s details loaded from database.`
                      });
                    } else {
                      // New passport - use OCR data
                      setPassportInfo(passportData);
                      setSearchQuery(data.passportNumber);
                      toast({
                        title: "Camera OCR - New Passport",
                        description: "Passport details extracted. Please verify information."
                      });
                    }
                  } catch (error) {
                    // Error checking database, still use OCR data
                    setPassportInfo(passportData);
                    setSearchQuery(data.passportNumber);
                    toast({
                      title: "Camera OCR Complete",
                      description: "Passport details extracted. Please verify information."
                    });
                  }

                  setShowOCRScanner(false);
                }}
                onClose={() => setShowOCRScanner(false)}
              />
            </DialogContent>
          </Dialog>
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
              <Input id="passportNumber" name="passportNumber" placeholder="e.g., P1234567" className="mt-1" value={passportInfo.passportNumber || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="nationality">Nationality</label>
              <Input id="nationality" name="nationality" placeholder="e.g., Australian" className="mt-1" value={passportInfo.nationality || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="surname">Surname</label>
              <Input id="surname" name="surname" placeholder="e.g., Smith" className="mt-1" value={passportInfo.surname || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="givenName">Given Name</label>
              <Input id="givenName" name="givenName" placeholder="e.g., John" className="mt-1" value={passportInfo.givenName || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="dob">Date of Birth</label>
              <Input id="dob" name="dob" type="date" placeholder="dd/mm/yyyy" className="mt-1" value={passportInfo.dob || ''} onChange={handleInputChange} />
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
            <div className="md:col-span-2">
              <label htmlFor="dateOfExpiry">Passport Expiry Date</label>
              <Input id="dateOfExpiry" name="dateOfExpiry" type="date" placeholder="dd/mm/yyyy" className="mt-1" value={passportInfo.dateOfExpiry || ''} onChange={handleInputChange} />
            </div>
          </form>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only passport number, name, nationality, sex, and expiry date are required. Photos are not stored in the system.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-8">
        <Button onClick={onNext} size="lg">
          Proceed to Payment →
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

  // POS Terminal transaction tracking (PCI-compliant - NO card data stored)
  const [posTerminalId, setPosTerminalId] = useState('');
  const [posTransactionRef, setPosTransactionRef] = useState('');
  const [posApprovalCode, setPosApprovalCode] = useState('');
  const [cardLastFour, setCardLastFour] = useState(''); // Only last 4 digits

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

    // For card/POS payments, require transaction reference
    if (requiresCardDetails && !posTransactionRef) {
      toast({
        variant: "destructive",
        title: "Transaction Reference Required",
        description: "Please enter the POS transaction reference number from the receipt."
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Check if this is an online payment gateway
      const isOnlineGateway = selectedMode === 'KINA BANK IPG' || selectedMode === 'BSP IPG';

      if (isOnlineGateway) {
        // Handle online payment gateway
        const gatewayName = selectedMode === 'KINA BANK IPG' ? GATEWAY_NAMES.KINA_BANK : GATEWAY_NAMES.BSP;

        // Check if gateway is active
        const isActive = await isGatewayActive(gatewayName);
        if (!isActive) {
          toast({
            variant: "destructive",
            title: "Gateway Not Available",
            description: `${selectedMode} is not currently active. Please select another payment method.`
          });
          setIsProcessing(false);
          return;
        }

        // Initiate online payment
        const paymentResult = await processOnlinePayment(
          gatewayName,
          {
            amount: amountAfterDiscount,
            currency: 'PGK',
            customerEmail: passportInfo.email || '',
            customerName: `${passportInfo.givenName} ${passportInfo.surname}`,
            passportNumber: passportInfo.passportNumber,
            nationality: passportInfo.nationality,
            description: `PNG Green Fees - ${passportInfo.passportNumber}`,
            returnUrl: `${window.location.origin}/payment-callback`,
            cancelUrl: `${window.location.origin}/individual-purchase`
          },
          null // userId will be set in service from auth context
        );

        // Redirect to payment gateway
        if (paymentResult.success && paymentResult.paymentUrl) {
          toast({
            title: "Redirecting to Payment Gateway",
            description: "You will be redirected to complete your payment securely."
          });

          // Store payment intent for later retrieval
          sessionStorage.setItem('payment_merchant_ref', paymentResult.merchantReference);
          sessionStorage.setItem('payment_passport_info', JSON.stringify(passportInfo));

          // Redirect to gateway payment page
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Failed to initiate payment gateway session');
        }

      } else {
        // Traditional payment method (cash, bank transfer, etc.)
        setPaymentData({
          paymentMethod: selectedMode,
          amount: amountAfterDiscount,
          discount,
          collectedAmount,
          returnedAmount: returnedAmount > 0 ? returnedAmount : 0,
          // PCI-compliant: Only store transaction references
          cardLastFour: requiresCardDetails ? cardLastFour : null,
          posTerminalId: requiresCardDetails ? posTerminalId : null,
          posTransactionRef: requiresCardDetails ? posTransactionRef : null,
          posApprovalCode: requiresCardDetails ? posApprovalCode : null,
        });

        toast({ title: "Payment Accepted", description: `Payment of PGK ${amountAfterDiscount.toFixed(2)} processed successfully.` });

        setTimeout(() => {
          setIsProcessing(false);
          onNext();
        }, 800);
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again."
      });
      setIsProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
      <Card>
        <CardHeader>
          <CardTitle>
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

          {/* POS Transaction Details (PCI-Compliant) */}
          {requiresCardDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-900">
                  <strong>🔒 PCI-Compliant:</strong> Enter transaction details from POS terminal receipt.
                  <br />
                  <span className="text-xs text-blue-700">No full card numbers are stored for security compliance.</span>
                </p>
              </div>
              <h3 className="font-semibold text-slate-700">POS Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <Label>Transaction Reference Number *</Label>
                  <Input
                    placeholder="e.g., TXN123456789 (from POS receipt)"
                    value={posTransactionRef}
                    onChange={(e) => setPosTransactionRef(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>POS Terminal ID</Label>
                    <Input
                      placeholder="e.g., POS-001"
                      value={posTerminalId}
                      onChange={(e) => setPosTerminalId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Approval Code</Label>
                    <Input
                      placeholder="e.g., APP123 (from receipt)"
                      value={posApprovalCode}
                      onChange={(e) => setPosApprovalCode(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Card Last 4 Digits (optional)</Label>
                  <Input
                    placeholder="1234 (for reconciliation only)"
                    value={cardLastFour}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCardLastFour(value);
                    }}
                    maxLength={4}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Only enter the last 4 digits - never the full card number
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg" disabled={isProcessing}>
          ← Back
        </Button>
        <Button onClick={handleProceed} size="lg" disabled={isProcessing} className="bg-gradient-to-r from-emerald-500 to-teal-600">
          {isProcessing ? 'Processing...' : 'Process Payment →'}
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
          <CardTitle className="text-green-700">
            ✓ Voucher Generated Successfully!
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
              Print Voucher
            </Button>
            <Button variant="outline" className="flex-1">
              Show QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline" size="lg">
          ← Create Another
        </Button>
        <Button onClick={() => window.location.href = '/'} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600">
          Done ✓
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
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [passportInfo, setPassportInfo] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  // Handle pre-filled data from camera scan
  useEffect(() => {
    if (location.state?.prefillData && location.state?.fromScan) {
      setPassportInfo(location.state.prefillData);
      toast({
        title: "Passport Data Loaded",
        description: `Scanned data for ${location.state.prefillData.givenName} ${location.state.prefillData.surname} has been loaded.`,
      });
    }
  }, [location.state, toast]);

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
      console.log('Starting voucher creation...');
      console.log('Passport info:', passportInfo);
      console.log('Payment data:', paymentData);
      console.log('User:', user);

      // First, check if passport exists or create it
      let passport = await getPassportByNumber(passportInfo.passportNumber);
      console.log('Found passport:', passport);

      if (!passport) {
        console.log('Creating new passport...');
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
        console.log('Created passport:', passport);
      }

      // Create individual purchase voucher
      const purchaseData = {
        passportId: passport.id,
        passportNumber: passport.passportNo || passport.passport_number || passportInfo.passportNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        cardLastFour: paymentData.cardLastFour,
        nationality: passport.nationality,
        discount: paymentData.discount || 0,
        collectedAmount: paymentData.collectedAmount,
        returnedAmount: paymentData.returnedAmount || 0,
      };
      console.log('Purchase data:', purchaseData);

      const createdVoucher = await createIndividualPurchase(purchaseData, user?.id);
      console.log('Created voucher:', createdVoucher);
      setVoucher(createdVoucher);

      toast({
        title: "Success!",
        description: "Voucher generated successfully.",
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        passportInfo,
        paymentData,
        user
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate voucher: ${error.message || 'Please try again.'}`,
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
