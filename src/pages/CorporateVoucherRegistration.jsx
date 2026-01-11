import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, AlertCircle, Camera, Scan, Printer, Mail, Download, Home } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import { NationalityCombobox } from '@/components/NationalityCombobox';
import { useScannerInput } from '@/hooks/useScannerInput';
import { useWebSerial, ConnectionState } from '@/hooks/useWebSerial';
import { ScannerStatusFull } from '@/components/ScannerStatus';
import { useToast } from '@/components/ui/use-toast';
import { convertCountryCodeToNationality } from '@/lib/countryCodeMapper';

/**
 * Voucher Registration Page
 *
 * Purpose: Allow users to register vouchers (corporate/individual/bulk) with passport data
 * Flow:
 * 1. Enter/scan voucher code
 * 2. Scan/enter passport data
 * 3. Submit registration
 * 4. Voucher status changes from 'pending_passport' to 'active'
 */

const CorporateVoucherRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step 1: Voucher lookup
  const [step, setStep] = useState(1); // 1: Enter code, 2: Enter passport, 3: Success
  const [voucherCode, setVoucherCode] = useState(searchParams.get('code') || ''); // Pre-fill from query param
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 2: Passport data
  const [passportData, setPassportData] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    nationality: 'Papua New Guinea',
    dateOfBirth: '',
    sex: 'Male',
    dateOfExpiry: ''
  });

  // Camera scanner
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Registration result
  const [registeredVoucher, setRegisteredVoucher] = useState(null);
  const [error, setError] = useState(null);

  // Email dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'tablet'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || hasSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // USB Barcode scanner for voucher code (Step 1)
  const voucherBarcodeScan = useScannerInput({
    onScan: (scannedCode) => {
      console.log('[VoucherRegistration] Voucher barcode scanned:', scannedCode);

      // Set the voucher code
      setVoucherCode(scannedCode.toUpperCase());

      toast({
        title: 'Voucher Barcode Scanned!',
        description: `Code ${scannedCode} detected from barcode scanner.`,
      });
    },
    enabled: step === 1, // Only active on Step 1
    minLength: 6, // Voucher codes are at least 6 characters
    timeout: 100, // 100ms between characters for barcode scanner
  });

  // Process scanned passport data (from any scanner source)
  const processScannedPassport = useCallback((data) => {
    console.log('[VoucherRegistration] Processing scanned passport:', data);

    // Convert 3-letter nationality code to full country name
    const nationalityCode = data.nationality;
    const nationalityFullName = nationalityCode ? convertCountryCodeToNationality(nationalityCode) : null;

    // Map Web Serial format (snake_case) to form format (camelCase)
    setPassportData(prev => ({
      ...prev,
      passportNumber: data.passport_no || data.passportNumber || prev.passportNumber,
      surname: data.surname || prev.surname,
      givenName: data.given_name || data.givenName || prev.givenName,
      nationality: nationalityFullName || prev.nationality,
      dateOfBirth: data.dob || prev.dateOfBirth,
      sex: data.sex || prev.sex,
      dateOfExpiry: data.date_of_expiry || data.dateOfExpiry || prev.dateOfExpiry
    }));

    toast({
      title: 'Passport Scanned!',
      description: 'Passport details filled automatically from scanner.',
    });
  }, [toast]);

  // PrehKeyTec Web Serial Scanner (hardware scanner with DTR/RTS control)
  const webSerialScanner = useWebSerial({
    onScan: (data) => {
      // Only process scan if we're on step 2 (passport entry)
      if (step === 2) {
        processScannedPassport(data);
      }
    },
    autoConnect: true,
    autoReconnect: true,
  });

  // Legacy keyboard wedge scanner support (fallback)
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: (data) => {
      if (step === 2 && data.type === 'mrz') {
        // MRZ passport scan - auto-fill all passport fields
        setPassportData(prev => ({
          ...prev,
          passportNumber: data.passportNumber || prev.passportNumber,
          surname: data.surname || prev.surname,
          givenName: data.givenName || prev.givenName,
          nationality: data.nationality || prev.nationality,
          dateOfBirth: data.dob || prev.dateOfBirth,
          sex: data.sex || prev.sex
        }));

        toast({
          title: 'Passport Scanned!',
          description: 'Passport details filled automatically from scanner.',
        });
      }
    },
    enableMrzParsing: true,
    autoFocus: false
  });

  // Camera scan handler (mobile devices)
  const handleCameraScan = (scannedData) => {
    setPassportData(prev => ({
      ...prev,
      passportNumber: scannedData.passportNumber || prev.passportNumber,
      surname: scannedData.surname || prev.surname,
      givenName: scannedData.givenName || prev.givenName,
      nationality: scannedData.nationality || prev.nationality,
      dateOfBirth: scannedData.dateOfBirth || prev.dateOfBirth,
      sex: scannedData.sex || prev.sex
    }));

    setShowScanner(false);

    toast({
      title: 'Passport Scanned!',
      description: 'Passport details filled automatically from camera.',
    });
  };

  /**
   * Step 1: Look up voucher by code
   */
  const handleVoucherLookup = async () => {
    const trimmedCode = voucherCode.trim();

    // Support both old CORP- format and new 8-character format
    const isOldFormat = trimmedCode.startsWith('CORP-');
    const isNewFormat = /^[A-Z0-9]{8}$/.test(trimmedCode);

    if (!trimmedCode || (!isOldFormat && !isNewFormat)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid voucher code (8 characters or CORP- format)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/voucher-registration/voucher/${voucherCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Voucher not found');
      }

      if (data.alreadyRegistered) {
        // Voucher already has passport - skip to success screen
        setRegisteredVoucher(data.voucher);
        setStep(3);
        toast({
          title: "Voucher Already Registered",
          description: `This voucher is already registered to passport ${data.voucher.passport_number}`,
        });
        setLoading(false);
        return;
      }

      if (data.expired) {
        setError('This voucher has expired and cannot be registered');
        setLoading(false);
        return;
      }

      setVoucher(data.voucher);
      setStep(2);
      toast({
        title: "Voucher Found",
        description: `Voucher for ${data.voucher.company_name} - PGK ${data.voucher.amount}`,
      });

    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Register passport to voucher
   */
  const handleRegisterPassport = async (e) => {
    e.preventDefault();

    if (!passportData.passportNumber || !passportData.surname || !passportData.givenName) {
      toast({
        title: "Missing Information",
        description: "Passport number, surname, and given name are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/voucher-registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCode: voucher.voucher_code,
          ...passportData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegisteredVoucher(data.voucher);
      setStep(3);
      toast({
        title: "Registration Successful",
        description: "Voucher is now active and ready to use",
      });

    } catch (err) {
      setError(err.message);
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle camera scan success
   */
  const handleScanSuccess = (scannedData) => {
    setPassportData({
      passportNumber: scannedData.passportNumber || '',
      surname: scannedData.surname || '',
      givenName: scannedData.givenName || '',
      nationality: scannedData.nationality || '',
      dateOfBirth: scannedData.dateOfBirth || '',
      sex: scannedData.sex || '',
      dateOfExpiry: scannedData.dateOfExpiry || ''
    });
    setShowScanner(false);
      toast({
      title: "Passport Scanned",
      description: "Passport data captured successfully",
    });
  };

  /**
   * Email voucher to customer
   */
  const handleEmailVoucher = async () => {
    // Validate email
    if (!emailAddress.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch(`/api/vouchers/email-single/${registeredVoucher.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: emailAddress.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: "Email Sent!",
        description: `Voucher successfully emailed to ${emailAddress}`,
      });

      setShowEmailDialog(false);
      setEmailAddress('');
    } catch (err) {
      console.error('Email failed:', err);
      toast({
        title: "Email Failed",
        description: err.message || 'Failed to send email. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  /**
   * Download voucher PDF
   */
  const handleDownloadVoucher = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vouchers/download/${registeredVoucher.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download voucher');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${registeredVoucher.voucher_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded",
        description: "Voucher PDF downloaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Print voucher - uses backend PDF for consistency
   */
  const handlePrintVoucher = async () => {
    if (!registeredVoucher) {
      toast({
        title: "Error",
        description: "No voucher available to print.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/vouchers/download/${registeredVoucher.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to load voucher for printing');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open PDF in new window and trigger print dialog
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback if popup blocked
        toast({
          title: "Pop-up Blocked",
          description: "Please allow pop-ups to print the voucher.",
          variant: "destructive"
        });
      }

      // Clean up blob URL after a delay to allow print dialog to open
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (err) {
      toast({
        title: "Print Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset and start over
   */
  const handleReset = () => {
    setStep(1);
    setVoucherCode('');
    setVoucher(null);
    setPassportData({
      passportNumber: '',
      surname: '',
      givenName: '',
      nationality: 'Papua New Guinea',
      dateOfBirth: '',
      sex: 'Male',
      dateOfExpiry: ''
    });
    setRegisteredVoucher(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Home/Back Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/app/agent')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Voucher Registration
        </h1>
        <p className="text-gray-600">
          Register your GREEN CARD voucher with passport information to activate it
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium">Enter Code</span>
        </div>
        <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
          </div>
          <span className="ml-2 font-medium">Scan Passport</span>
        </div>
        <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step >= 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
          </div>
          <span className="ml-2 font-medium">Complete</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Enter Voucher Code */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Scan or Enter Voucher Code</CardTitle>
            <CardDescription>
              Scan the barcode on your GREEN CARD or enter the code manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barcode Scanner Status */}
            {voucherBarcodeScan.isScanning && (
              <Alert className="bg-blue-50 border-blue-200">
                <Scan className="h-4 w-4 text-blue-600 animate-pulse" />
                <AlertDescription className="text-blue-900">
                  <strong>Scanning barcode...</strong> Scanner detected rapid input
                </AlertDescription>
              </Alert>
            )}

            {/* Scanner Ready Indicator */}
            {!voucherBarcodeScan.isScanning && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">USB Barcode Scanner Ready</p>
                    <p className="text-xs text-emerald-700">Scan the voucher barcode with your USB scanner</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="voucherCode">Voucher Code</Label>
              <Input
                id="voucherCode"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="e.g., 3IEW5268 or CORP-xxxxx"
                maxLength={50}
                className="text-lg font-mono tracking-wider"
              />
              <p className="text-xs text-slate-500 mt-1">Manual entry (if scanner unavailable)</p>
            </div>

            <Button
              onClick={handleVoucherLookup}
              disabled={loading || voucherCode.trim().length < 8}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up voucher...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Find Voucher
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Passport Data */}
      {step === 2 && voucher && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Register Passport</CardTitle>
            <CardDescription>
              Scan or enter passport information for voucher {voucher.voucher_code}
            </CardDescription>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-600">Company:</span> <span className="font-medium">{voucher.company_name}</span></div>
                <div><span className="text-gray-600">Amount:</span> <span className="font-medium">PGK {voucher.amount}</span></div>
                <div><span className="text-gray-600">Valid Until:</span> <span className="font-medium">{new Date(voucher.valid_until).toLocaleDateString()}</span></div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium text-amber-600">Pending Passport</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {/* PrehKeyTec Hardware Scanner Status (Desktop) */}
            {!isMobile && (
              <div className="mb-6">
                <ScannerStatusFull
                  connectionState={webSerialScanner.connectionState}
                  scanCount={webSerialScanner.scanCount}
                  error={webSerialScanner.error}
                  onConnect={webSerialScanner.connect}
                  onDisconnect={webSerialScanner.disconnect}
                  onReconnect={webSerialScanner.reconnect}
                  isSupported={webSerialScanner.isSupported}
                  reconnectAttempt={webSerialScanner.reconnectAttempt}
                />

                {/* Scanner Ready Indicator */}
                {webSerialScanner.isReady && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 mt-4">
                    <p className="text-emerald-700 font-medium text-center">
                      PrehKeyTec Scanner Ready - Place passport on scanner to auto-fill
                      {webSerialScanner.scanCount > 0 && (
                        <span className="ml-2">({webSerialScanner.scanCount} scanned)</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Fallback keyboard scanner indicator */}
                {!webSerialScanner.isSupported && isScannerActive && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-amber-700 font-medium text-center">
                      Keyboard Scanner Active - Ready to scan passport MRZ
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Camera Scanner Button */}
            {isMobile && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-blue-700 font-medium text-center">
                    Use your phone camera to scan passport MRZ
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    disabled={loading}
                  >
                    <Camera className="h-5 w-5" />
                    Scan Passport with Camera
                  </Button>
                  <p className="text-xs text-blue-600 text-center">
                    Point camera at the MRZ (machine-readable zone) at the bottom of your passport
                  </p>
                </div>
              </div>
            )}

            {/* Camera Scanner Button (Desktop - alternative to hardware scanner) */}
            {!isMobile && !webSerialScanner.isReady && (
              <div className="mb-6">
                <Button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full"
                  variant="outline"
                  size="lg"
                  disabled={loading}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Scan Passport with Camera (Alternative)
                </Button>
              </div>
            )}

            {/* Manual Entry Form */}
            <form onSubmit={handleRegisterPassport} className="space-y-4">
              <div className="text-center text-sm text-gray-500 mb-4">
                or enter manually below
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passportNumber">Passport Number *</Label>
                  <Input
                    id="passportNumber"
                    value={passportData.passportNumber}
                    onChange={(e) => setPassportData({...passportData, passportNumber: e.target.value.toUpperCase()})}
                    required
                    disabled={loading}
                    className="font-mono"
                    placeholder="e.g., AB123456"
                  />
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <NationalityCombobox
                    value={passportData.nationality}
                    onChange={(value) => setPassportData({...passportData, nationality: value})}
                    disabled={loading}
                    placeholder="Select nationality..."
                  />
                </div>

                <div>
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    value={passportData.surname}
                    onChange={(e) => setPassportData({...passportData, surname: e.target.value.toUpperCase()})}
                    required
                    disabled={loading}
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <Label htmlFor="givenName">Given Name *</Label>
                  <Input
                    id="givenName"
                    value={passportData.givenName}
                    onChange={(e) => setPassportData({...passportData, givenName: e.target.value.toUpperCase()})}
                    required
                    disabled={loading}
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={passportData.dateOfBirth}
                    onChange={(e) => setPassportData({...passportData, dateOfBirth: e.target.value})}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Select
                    value={passportData.sex}
                    onValueChange={(value) => setPassportData({...passportData, sex: value})}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateOfExpiry">Passport Expiry</Label>
                  <Input
                    id="dateOfExpiry"
                    type="date"
                    value={passportData.dateOfExpiry}
                    onChange={(e) => setPassportData({...passportData, dateOfExpiry: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Voucher'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && registeredVoucher && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle2 className="mr-2 h-6 w-6" />
              Registration Successful!
            </CardTitle>
            <CardDescription>
              Your voucher is now active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Voucher Code</p>
                  <p className="text-lg font-bold font-mono text-green-700">{registeredVoucher.voucher_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-bold text-green-700">ACTIVE</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Passport</p>
                  <p className="text-lg font-medium font-mono">{registeredVoucher.passport_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Until</p>
                  <p className="text-lg font-medium">{new Date(registeredVoucher.valid_until).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Your Voucher Actions:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Button
                  onClick={handlePrintVoucher}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Voucher
                </Button>
                <Button
                  onClick={() => setShowEmailDialog(true)}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  disabled={loading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Voucher
                </Button>
                <Button
                  onClick={handleDownloadVoucher}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  disabled={loading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-amber-900 mb-2">Important Information:</h3>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Present your voucher code at the entry checkpoint</li>
                <li>Keep your passport with you for verification</li>
                <li>Voucher is valid for single-use entry</li>
                <li>Passport details: {registeredVoucher.passport_number}</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Register Another Voucher
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-white z-[9999]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 9999,
            overflow: 'auto'
          }}
        >
          <div className="p-4">
            <SimpleCameraScanner
              onScanSuccess={handleCameraScan}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {/* Email Voucher Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Voucher</DialogTitle>
            <DialogDescription>
              Enter the email address where you'd like to receive this voucher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                disabled={isSendingEmail}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSendingEmail) {
                    handleEmailVoucher();
                  }
                }}
              />
              <p className="text-xs text-slate-500">
                The voucher PDF will be sent to this email address
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEmailVoucher}
                disabled={isSendingEmail}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmailAddress('');
                }}
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CorporateVoucherRegistration;
