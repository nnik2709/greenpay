
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, Camera, XCircle, CheckCircle, AlertCircle, Loader2, FileText, User, Calendar, Hash, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '@/lib/supabaseClient';
import { useScannerInput } from '@/hooks/useScannerInput';
import { parseMrz as parseMrzUtil } from '@/lib/mrzParser';

const ScanAndValidate = () => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);
  const audioContext = useRef(null);

  // Initialize audio context
  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  // Hardware scanner support
  const { isScanning: isScannerActive } = useScannerInput({
    onScanComplete: (data) => {
      // Handle both MRZ and simple scans
      if (data.type === 'mrz') {
        // MRZ passport scan - convert to our format
        const mrzResult = {
          type: 'passport',
          status: 'success',
          data: {
            passportNumber: data.passportNumber,
            surname: data.surname,
            givenName: data.givenName,
            nationality: data.nationality,
            dob: data.dob,
            sex: data.sex,
            dateOfExpiry: data.dateOfExpiry,
          },
          message: data.message
        };
        setValidationResult(mrzResult);
        setInputValue('');

        // Success feedback
        playSuccessBeep();
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 1000);
        if (navigator.vibrate) navigator.vibrate(200);
      } else {
        // Simple barcode/QR scan
        handleValidation(data.value);
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

  // Success beep function
  const playSuccessBeep = async () => {
    if (!audioContext.current) return;

    try {
      // Resume audio context if suspended (mobile browsers)
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }

      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.2);
    } catch (error) {
      console.error('Beep sound error:', error);
    }
  };

  // Use the centralized MRZ parser
  const parseMrz = (mrzString) => {
    const result = parseMrzUtil(mrzString);
    if (result.success) {
      return {
        type: 'passport',
        status: 'success',
        data: {
          passportNumber: result.passportNumber,
          surname: result.surname,
          givenName: result.givenName,
          nationality: result.nationality,
          dob: result.dob,
          sex: result.sex,
          dateOfExpiry: result.dateOfExpiry,
        },
        message: result.message
      };
    } else {
      return { type: 'error', status: 'error', message: result.message };
    }
  };

  const validateVoucher = async (code) => {
    try {
      console.log('Validating voucher code:', code.trim());

      // Try individual purchases first
      const { data: individualData, error: individualError } = await supabase
        .from('individual_purchases')
        .select('*')
        .eq('voucher_code', code.trim())
        .maybeSingle();

      console.log('Individual query result:', { individualData, individualError });

      // Try corporate vouchers if not found
      const { data: corporateData, error: corporateError } = await supabase
        .from('corporate_vouchers')
        .select('*')
        .eq('voucher_code', code.trim())
        .maybeSingle();

      console.log('Corporate query result:', { corporateData, corporateError });

      const data = individualData || corporateData;
      const voucherType = individualData ? 'Individual' : corporateData ? 'Corporate' : null;

      if (!data) {
        console.log('No voucher found for code:', code.trim());
        return { type: 'error', status: 'error', message: 'Voucher code not found.' };
      }

      console.log('Found voucher:', { type: voucherType, data });

      const now = new Date();
      const expiryDate = new Date(data.valid_until);
      const isExpired = expiryDate < now;
      const isUsed = data.used_at !== null;

      if (isUsed) {
        return {
          type: 'voucher',
          status: 'error',
          message: `${voucherType} voucher has already been used on ${new Date(data.used_at).toLocaleDateString()}.`,
          data: { ...data, voucherType }
        };
      }

      if (isExpired) {
        return {
          type: 'voucher',
          status: 'error',
          message: `${voucherType} voucher has expired.`,
          data: { ...data, voucherType }
        };
      }

      return {
        type: 'voucher',
        status: 'success',
        message: `${voucherType} voucher is valid and ready to use!`,
        data: { ...data, voucherType }
      };
    } catch (error) {
      console.error('Voucher validation error:', error);
      return { type: 'error', status: 'error', message: 'Error validating voucher.' };
    }
  };

  const handleValidation = useCallback(async (code) => {
    if (!code) return;

    console.log('=== VALIDATION STARTED ===');
    console.log('Raw code received:', code);
    console.log('Code length:', code.length);
    console.log('Code type:', typeof code);
    console.log('Code chars:', Array.from(code).map((c, i) => `[${i}]='${c}' (${c.charCodeAt(0)})`));

    // Show scanned code in toast for debugging
    toast({
      title: "Scanned Code",
      description: `Code: "${code}" (length: ${code.length})`,
      duration: 5000
    });

    const now = Date.now();
    if (code === lastScannedCode.current && (now - lastScanTime.current) < 2000) {
      toast({ title: "Duplicate Scan", description: "This code was just processed.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setValidationResult(null);
    lastScannedCode.current = code;
    lastScanTime.current = now;

    try {
      let result;
      if (code.startsWith('P<')) {
        result = parseMrz(code);
      } else {
        result = await validateVoucher(code);
      }
      setValidationResult(result);
      setInputValue('');

      // Play beep and show flash on success
      if (result.status === 'success') {
        playSuccessBeep();
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 1000);

        // Add vibration for mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(200); // Vibrate for 200ms
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: code
      });
      setValidationResult({
        type: 'error',
        status: 'error',
        message: `Validation failed: ${error.message || 'Please try again.'}`
      });
      setInputValue('');
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!showCameraScanner) return;

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.protocol === 'https:';

    if (!isSecureContext) {
      toast({
        title: "Camera Not Available",
        description: "Camera access requires HTTPS. Please use manual entry or visit via HTTPS.",
        variant: "destructive",
      });
      setShowCameraScanner(false);
      return;
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      },
      {
        verbose: false,
        formatsToSupport: undefined,
        useBarCodeDetectorIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2
      }
    );

    const onScanSuccess = (decodedText) => {
      handleValidation(decodedText);
      setShowCameraScanner(false);
    };

    const onScanError = (error) => {
      // Don't show every scan error, only important ones
      if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
        toast({
          title: "Camera Permission Denied",
          description: "Please allow camera access and try again.",
          variant: "destructive",
        });
        setShowCameraScanner(false);
      }
    };

    scanner.render(onScanSuccess, onScanError);

    return () => {
      if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [showCameraScanner, handleValidation, toast]);

  const ResultCard = ({ result }) => {
    if (!result) return null;

    const isSuccess = result.status === 'success';
    const Icon = isSuccess ? CheckCircle : XCircle;
    const color = isSuccess ? 'green' : 'red';

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-${color}-500`}>
          <CardHeader className={`bg-${color}-50`}>
            <CardTitle className={`flex items-center gap-2 text-${color}-700`}>
              <Icon /> {isSuccess ? 'Validation Successful' : 'Validation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="font-semibold mb-3">{result.message}</p>
            {result.type === 'passport' && result.data && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-500" /><strong>Passport No:</strong> {result.data.passportNumber}</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /><strong>Name:</strong> {result.data.givenName} {result.data.surname}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /><strong>Expiry:</strong> {result.data.dateOfExpiry}</div>
              </div>
            )}
            {result.type === 'voucher' && result.data && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /><strong>Type:</strong> {result.data.voucherType} Voucher</div>
                <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-500" /><strong>Voucher Code:</strong> {result.data.voucher_code}</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /><strong>Passport:</strong> {result.data.passport_number}</div>
                {result.data.company_name && (
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /><strong>Company:</strong> {result.data.company_name}</div>
                )}
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /><strong>Valid Until:</strong> {new Date(result.data.valid_until).toLocaleDateString()}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4 relative"
    >
      {/* Success Flash Overlay */}
      <AnimatePresence>
        {showSuccessFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-500 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Scan & Validate
        </h1>
        <p className="text-slate-600">Scan passport MRZ codes or voucher QR codes to validate.</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 space-y-4">
          {/* Primary Camera Button - Full width on mobile */}
          <Button
            variant={showCameraScanner ? "destructive" : "default"}
            className="w-full h-20 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            onClick={() => setShowCameraScanner(s => !s)}
            disabled={!window.isSecureContext &&
                     window.location.hostname !== 'localhost' &&
                     window.location.hostname !== '127.0.0.1' &&
                     window.location.protocol !== 'https:'}
          >
            <Camera className="mr-3 w-8 h-8" />
            {showCameraScanner ? 'Close Camera' : 'Scan with Camera'}
            {!window.isSecureContext &&
             window.location.hostname !== 'localhost' &&
             window.location.hostname !== '127.0.0.1' &&
             window.location.protocol !== 'https:' &&
             <span className="text-xs text-orange-200 ml-2">(HTTPS required)</span>}
          </Button>

          {/* Secondary Manual Input Button */}
          <Button variant="outline" className="w-full h-14 text-base" onClick={() => document.getElementById('manual-input').focus()}>
            <Keyboard className="mr-2" /> Manual Input (Optional)
          </Button>
          <AnimatePresence>
            {showCameraScanner && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {/* Camera Permission Instructions */}
                <Card className="mb-4 bg-emerald-50 border-emerald-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Camera className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-emerald-900 mb-1 text-lg">Allow Camera Access</h3>
                        <p className="text-emerald-800 text-sm mb-2">
                          Your browser will ask for camera permission. Please tap <strong>"Allow"</strong> to scan QR codes.
                        </p>
                        <ul className="text-emerald-700 text-xs space-y-1 list-disc list-inside">
                          <li>Position the QR code within the scanning frame</li>
                          <li>Hold steady until it scans automatically</li>
                          <li>You'll hear a beep when successful</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div id="qr-reader" className="w-full"></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
            {isScannerActive ? (
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 animate-pulse" />
            ) : (
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            )}
            <Input
              id="manual-input"
              placeholder={isScannerActive ? "Scanning..." : "Enter code or scan with device..."}
              className={`pl-10 h-14 text-lg ${isScannerActive ? 'border-emerald-500 ring-2 ring-emerald-200' : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidation(inputValue)}
              disabled={isProcessing || isScannerActive}
            />
            {isProcessing && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        <ResultCard result={validationResult} />
      </AnimatePresence>

      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800"><AlertCircle /> How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p><strong>USB/Bluetooth Scanner (Recommended):</strong> Simply scan a QR code, barcode, or passport MRZ. The system automatically detects and processes the scan. Visual feedback shows scanning status.</p>
          <p><strong>Camera:</strong> Click 'Scan with Camera' and grant permission. Position the QR code or barcode within the frame. <em>Requires HTTPS in production.</em></p>
          <p><strong>Manual Entry:</strong> Type or paste the code into the input field and press Enter.</p>
          <p><strong>Passport MRZ:</strong> If scanning a passport, scan the 2 lines at the bottom. The system will automatically parse and display passport details.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanAndValidate;
