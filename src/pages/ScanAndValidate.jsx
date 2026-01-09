
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import api from '@/lib/api/client';
import { useScannerInput } from '@/hooks/useScannerInput';
import { parseMrz as parseMrzUtil } from '@/lib/mrzParser';

const ScanAndValidate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showErrorFlash, setShowErrorFlash] = useState(false);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);
  const audioContext = useRef(null);
  const scannerRef = useRef(null);

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

      oscillator.frequency.value = 800; // Hz - pleasant high tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.2);
    } catch (error) {
      console.error('Beep sound error:', error);
    }
  };

  // Error alert sound function
  const playErrorAlert = async () => {
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

      // Lower frequency for error sound (more alarming)
      oscillator.frequency.value = 300; // Hz - lower, more ominous tone
      oscillator.type = 'sawtooth'; // Harsher sound for errors

      gainNode.gain.setValueAtTime(0.4, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.5);
    } catch (error) {
      console.error('Error sound error:', error);
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

      // Call the PostgreSQL API endpoint
      const result = await api.vouchers.validate(code.trim());

      console.log('Validation result:', result);

      return result;
    } catch (error) {
      console.error('Voucher validation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });

      // Better error messaging
      let errorMessage = 'Error validating voucher.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please check backend logs.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        type: 'error',
        status: 'error',
        message: errorMessage
      };
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

      // Play sound and show flash based on result
      if (result.status === 'success') {
        // Success feedback: green flash + beep
        playSuccessBeep();
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 1000);

        // Single short vibration for success
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      } else {
        // Error feedback: red flash + alert sound
        playErrorAlert();
        setShowErrorFlash(true);
        setTimeout(() => setShowErrorFlash(false), 1000);

        // Two short vibrations for error
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
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
    if (!showCameraScanner) {
      // Cleanup when camera is closed
      if (scannerRef.current) {
        console.log('[Scanner] Stopping camera...');
        scannerRef.current.stop().then(() => {
          console.log('[Scanner] Camera stopped');
          scannerRef.current = null;
        }).catch(err => {
          console.error("[Scanner] Stop error:", err);
          scannerRef.current = null;
        });
      }
      return;
    }

    // Prevent double initialization
    if (scannerRef.current) {
      console.log('[Scanner] Scanner already running, skipping...');
      return;
    }

    console.log('[Scanner] Starting camera scanner...');

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext ||
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.protocol === 'https:';

    if (!isSecureContext) {
      toast({
        title: "Camera Not Available",
        description: "Camera access requires HTTPS.",
        variant: "destructive",
      });
      setShowCameraScanner(false);
      return;
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        const onScanSuccess = (decodedText, decodedResult) => {
          console.log('[Scanner] Scan successful:', decodedText);
          handleValidation(decodedText);

          // Stop scanner after successful scan
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              scannerRef.current = null;
              setShowCameraScanner(false);
            }).catch(err => console.error('[Scanner] Stop error:', err));
          }
        };

        const onScanFailure = (error) => {
          // This is called frequently when no QR code is detected, so we don't log it
        };

        // Start camera with back camera (environment facing)
        console.log('[Scanner] Requesting camera access...');
        await scanner.start(
          { facingMode: "environment" }, // Use back camera by default
          config,
          onScanSuccess,
          onScanFailure
        );

        console.log('[Scanner] Camera started successfully');

      } catch (err) {
        console.error('[Scanner] Start error:', err);

        if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission denied')) {
          toast({
            title: "Camera Permission Denied",
            description: "Please allow camera access to scan vouchers.",
            variant: "destructive",
          });
        } else if (err.toString().includes('NotFoundError')) {
          toast({
            title: "No Camera Found",
            description: "No camera detected on this device.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera Error",
            description: err.message || "Failed to start camera. Please try again.",
            variant: "destructive",
          });
        }

        setShowCameraScanner(false);
        scannerRef.current = null;
      }
    };

    startScanner();

    return () => {
      console.log('[Scanner] Cleanup...');
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error("[Scanner] Cleanup stop error:", err));
        scannerRef.current = null;
      }
    };
  }, [showCameraScanner, handleValidation, toast]);

  const ResultCard = ({ result }) => {
    if (!result) return null;

    const isSuccess = result.status === 'success';
    const color = isSuccess ? 'green' : 'red';

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-${color}-500`}>
          <CardHeader className={`bg-${color}-50`}>
            <CardTitle className={`flex items-center gap-2 text-${color}-700`}>
              {isSuccess ? 'Validation Successful' : 'Validation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="font-semibold mb-3">{result.message}</p>
            {result.type === 'passport' && result.data && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><strong>Passport No:</strong> {result.data.passportNumber}</div>
                <div className="flex items-center gap-2"><strong>Name:</strong> {result.data.givenName} {result.data.surname}</div>
                <div className="flex items-center gap-2"><strong>Expiry:</strong> {result.data.dateOfExpiry}</div>
              </div>
            )}
            {result.type === 'voucher' && result.data && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><strong>Type:</strong> {result.data.voucherType} Voucher</div>
                <div className="flex items-center gap-2"><strong>Voucher Code:</strong> {result.data.voucher_code}</div>
                <div className="flex items-center gap-2"><strong>Passport:</strong> {result.data.passport_number}</div>
                {result.data.company_name && (
                  <div className="flex items-center gap-2"><strong>Company:</strong> {result.data.company_name}</div>
                )}
                <div className="flex items-center gap-2"><strong>Valid Until:</strong> {new Date(result.data.valid_until).toLocaleDateString()}</div>
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
      {/* Success Flash Overlay */}
      <AnimatePresence>
        {showSuccessFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-500 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* Error Flash Overlay */}
      <AnimatePresence>
        {showErrorFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-500 pointer-events-none z-50"
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
          {/* Scanner Options Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Primary: Mobile Camera Scanner (Full width on mobile) */}
            <Button
              variant={showCameraScanner ? "destructive" : "default"}
              className="h-28 sm:h-24 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              onClick={() => setShowCameraScanner(s => !s)}
              disabled={!window.isSecureContext &&
                       window.location.hostname !== 'localhost' &&
                       window.location.hostname !== '127.0.0.1' &&
                       window.location.protocol !== 'https:'}
            >
              <div className="text-center">
                <span className="block text-xl sm:text-base font-bold">{showCameraScanner ? 'Close Camera' : 'Scan Voucher Barcode'}</span>
                <span className="block text-sm sm:text-xs opacity-90 mt-1">Tap to open camera scanner</span>
              </div>
            </Button>

            {/* Hardware Scanner Status Indicator */}
            {isScannerActive && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-emerald-900">USB Scanner Ready</p>
                    <p className="text-sm text-emerald-700">Simply scan a barcode or QR code</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Option (Collapsed by default on mobile) */}
          <details className="border rounded-lg">
            <summary className="cursor-pointer p-4 hover:bg-slate-50 rounded-lg font-medium text-slate-700">
              Manual Entry (Optional)
            </summary>
            <div className="p-4 pt-0">
              <p className="text-sm text-slate-600 mb-3">Type or paste voucher code manually</p>
              <div className="relative">
                <Input
                  id="manual-input"
                  placeholder="Enter voucher code..."
                  className="h-12 text-base"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidation(inputValue)}
                  disabled={isProcessing}
                />
                <Button
                  onClick={() => handleValidation(inputValue)}
                  disabled={!inputValue || isProcessing}
                  className="mt-2 w-full"
                >
                  {isProcessing ? 'Validating...' : 'Validate Code'}
                </Button>
              </div>
            </div>
          </details>

          {/* QR Code Scanner View */}
          <AnimatePresence>
            {showCameraScanner && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {/* Camera Permission Instructions */}
                <Card className="mb-4 bg-emerald-50 border-emerald-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div>
                        <h3 className="font-bold text-emerald-900 mb-1 text-lg">Camera Scanner Active</h3>
                        <p className="text-emerald-800 text-sm mb-2">
                          Position voucher barcode or QR code in the frame
                        </p>
                        <ul className="text-emerald-700 text-xs space-y-1 list-disc list-inside">
                          <li>Center the code within the scanning box</li>
                          <li>Hold steady for automatic detection</li>
                          <li>You'll hear a beep and see a flash when successful</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <AnimatePresence>
        <ResultCard result={validationResult} />
      </AnimatePresence>

      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 text-lg sm:text-base">
            How to Scan & Validate Vouchers
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-4">
          <div className="bg-white/50 p-3 rounded-lg">
            <p className="font-bold mb-2 text-base flex items-center gap-2">
              Mobile Phone Camera (Recommended)
            </p>
            <ol className="text-sm space-y-1 list-decimal list-inside ml-6">
              <li>Tap the big green "Scan Voucher Barcode" button above</li>
              <li>Allow camera access when prompted</li>
              <li>Point your camera at the voucher barcode or QR code</li>
              <li>Hold steady until you hear a beep</li>
              <li>Check the validation result below</li>
            </ol>
          </div>

          <div className="bg-white/50 p-3 rounded-lg">
            <p className="font-bold mb-2 text-base flex items-center gap-2">
              USB/Bluetooth Scanner (Desktop/Counter)
            </p>
            <p className="text-sm">
              Simply scan a barcode or QR code with your hardware scanner. The system automatically detects and validates the voucher with instant feedback (beep + flash).
            </p>
          </div>

          <div className="bg-white/50 p-3 rounded-lg">
            <p className="font-bold mb-2 text-base flex items-center gap-2">
              Manual Entry (Backup)
            </p>
            <p className="text-sm">
              If scanning doesn't work, expand "Manual Entry" above and type the voucher code manually.
            </p>
          </div>

          <div className="border-t border-blue-300 pt-3 mt-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">Validation Results:</p>
            <ul className="text-xs space-y-1">
              <li><strong>Green Flash + Beep:</strong> Valid voucher - proceed with exit clearance</li>
              <li><strong>Red Flash + Alert:</strong> Invalid/Used/Expired - do not allow exit</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanAndValidate;
