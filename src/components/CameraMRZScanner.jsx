import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CameraMRZScanner = ({ onScanSuccess, onClose }) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef(null);

  // MRZ parsing function (same as in ScanAndValidate)
  const parseMrz = (mrzString) => {
    try {
      const cleanedMrz = mrzString.replace(/\s/g, '');
      if (cleanedMrz.length < 88) throw new Error("MRZ length is too short.");

      const line1 = cleanedMrz.substring(0, 44);
      const line2 = cleanedMrz.substring(44, 88);

      const names = line1.substring(5).split('<<');
      const surname = names[0].replace(/</g, ' ').trim();
      const givenName = names.slice(1).join(' ').replace(/</g, ' ').trim();

      const passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
      const nationality = line2.substring(10, 13);
      
      const dobRaw = line2.substring(13, 19);
      let dobYear = parseInt(dobRaw.substring(0, 2), 10);
      dobYear += (dobYear > (new Date().getFullYear() % 100)) ? 1900 : 2000;
      const dob = `${dobYear}-${dobRaw.substring(2, 4)}-${dobRaw.substring(4, 6)}`;

      const sex = line2.substring(20, 21);
      
      const expiryRaw = line2.substring(21, 27);
      let expiryYear = parseInt(expiryRaw.substring(0, 2), 10);
      expiryYear += (expiryYear > 50) ? 1900 : 2000;
      const expiryDate = `${expiryYear}-${expiryRaw.substring(2, 4)}-${expiryRaw.substring(4, 6)}`;

      return {
        passportNumber,
        surname,
        givenName,
        nationality,
        dateOfBirth: dob,
        sex: sex === 'M' ? 'Male' : 'Female',
        dateOfExpiry: expiryDate,
      };
    } catch (error) {
      throw new Error('Invalid MRZ format: ' + error.message);
    }
  };

  const handleScanSuccess = useCallback(async (decodedText) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setScanResult(null);

    try {
      // Check if it's an MRZ code (starts with P<)
      if (decodedText.startsWith('P<')) {
        const passportData = parseMrz(decodedText);
        setScanResult({
          type: 'success',
          data: passportData,
          message: 'Passport MRZ scanned successfully!'
        });
        
        toast({
          title: "Scan Successful",
          description: `Passport details for ${passportData.givenName} ${passportData.surname} have been extracted.`,
        });

        // Auto-proceed after a short delay
        setTimeout(() => {
          onScanSuccess(passportData);
        }, 1500);
      } else {
        throw new Error('Not a valid passport MRZ code. Please scan the bottom of the passport.');
      }
    } catch (error) {
      setScanResult({
        type: 'error',
        message: error.message
      });
      
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onScanSuccess, toast]);

  const handleScanError = useCallback((error) => {
    // Don't show every scan error, only important ones
    if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
      toast({
        title: "Camera Permission Denied",
        description: "Please allow camera access and try again.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  }, [toast]);

  const startScanning = () => {
    if (isScanning) return;

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
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    const newScanner = new Html5QrcodeScanner(
      'mrz-scanner',
      {
        fps: 10,
        qrbox: 300,
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

    newScanner.render(handleScanSuccess, handleScanError);
    setScanner(newScanner);
  };

  const stopScanning = () => {
    if (scanner) {
      try {
        scanner.clear().catch(err => {
          // Silently catch errors - DOM might be gone already
        });
      } catch (err) {
        // Silently catch synchronous errors
      }
      setScanner(null);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scanner) {
        try {
          // Use a small delay to let React finish its cleanup first
          setTimeout(() => {
            scanner.clear().catch(err => {
              // Silently catch errors - DOM might be gone already
            });
          }, 0);
        } catch (err) {
          // Silently catch synchronous errors
        }
      }
    };
  }, [scanner]);

  return (
    <div className="space-y-4 bg-white">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Scan Passport MRZ</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Camera className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">How to Scan</h3>
            <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
              <li>Position the passport so the MRZ (bottom lines) are clearly visible</li>
              <li>Ensure good lighting and hold the passport steady</li>
              <li>The scanner will automatically detect and parse the MRZ</li>
              <li>You'll be redirected to create a passport with the scanned data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanner Controls */}
      <div className="flex justify-center gap-4">
        {!isScanning ? (
          <Button 
            onClick={startScanning}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            disabled={isProcessing}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera Scan
          </Button>
        ) : (
          <Button 
            onClick={stopScanning}
            variant="destructive"
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
      </div>

      {/* Scanner Container */}
      <div className="relative">
        <div id="mrz-scanner" className="w-full min-h-[300px] bg-slate-100 rounded-lg flex items-center justify-center">
          {!isScanning && (
            <div className="text-center text-slate-500">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Click "Start Camera Scan" to begin</p>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Processing scan...</p>
            </div>
          </div>
        )}
      </div>

      {/* Scan Result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              scanResult.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {scanResult.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  scanResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message}
                </p>
                {scanResult.data && (
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Name:</strong> {scanResult.data.givenName} {scanResult.data.surname}</p>
                    <p><strong>Passport:</strong> {scanResult.data.passportNumber}</p>
                    <p><strong>Nationality:</strong> {scanResult.data.nationality}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {scanResult?.type === 'success' && (
          <Button 
            onClick={() => onScanSuccess(scanResult.data)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            Use Scanned Data
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraMRZScanner;
