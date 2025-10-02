
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, Camera, XCircle, CheckCircle, AlertCircle, Loader2, FileText, User, Calendar, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Html5QrcodeScanner } from 'html5-qrcode';
import { corporateVouchers } from '@/lib/validationData';
import { individualPayments } from '@/lib/validationData';
import { passports as mockPassports } from '@/lib/passportData';

const ScanAndValidate = () => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);

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
        type: 'passport',
        status: 'success',
        data: {
          passportNumber,
          surname,
          givenName,
          nationality,
          dob,
          sex: sex === 'M' ? 'Male' : 'Female',
          dateOfExpiry: expiryDate,
        },
        message: 'Passport MRZ parsed successfully.'
      };
    } catch (error) {
      return { type: 'error', status: 'error', message: 'Invalid MRZ format.' };
    }
  };

  const validateVoucher = (code) => {
    const corporate = corporateVouchers.find(v => v.code === code);
    if (corporate) {
      if (corporate.used_at) return { type: 'voucher', status: 'error', message: 'Voucher has already been used.', data: corporate };
      if (new Date(corporate.valid_until) < new Date()) return { type: 'voucher', status: 'error', message: 'Voucher has expired.', data: corporate };
      const passport = mockPassports.find(p => p.passportNumber === corporate.passport_no);
      return { type: 'voucher', status: 'success', message: 'Corporate voucher is valid.', data: { ...corporate, passport } };
    }

    const individual = individualPayments.find(p => p.voucher_code === code);
    if (individual) {
      if (individual.used_at) return { type: 'voucher', status: 'error', message: 'Voucher has already been used.', data: individual };
      const passport = mockPassports.find(p => p.passportNumber === individual.passport_no);
      return { type: 'voucher', status: 'success', message: 'Individual voucher is valid.', data: { ...individual, passport } };
    }

    return { type: 'error', status: 'error', message: 'Voucher code not found.' };
  };

  const handleValidation = useCallback((code) => {
    if (!code) return;

    const now = Date.now();
    if (code === lastScannedCode.current && (now - lastScanTime.current) < 2000) {
      toast({ title: "Duplicate Scan", description: "This code was just processed.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setValidationResult(null);
    lastScannedCode.current = code;
    lastScanTime.current = now;

    setTimeout(() => {
      let result;
      if (code.startsWith('P<')) {
        result = parseMrz(code);
      } else {
        result = validateVoucher(code);
      }
      setValidationResult(result);
      setIsProcessing(false);
      setInputValue('');
    }, 500);
  }, [toast]);

  useEffect(() => {
    if (!showCameraScanner) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    const onScanSuccess = (decodedText) => {
      handleValidation(decodedText);
      setShowCameraScanner(false);
    };

    scanner.render(onScanSuccess, (error) => {
      // console.warn(error);
    });

    return () => {
      if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [showCameraScanner, handleValidation]);

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
            {result.type === 'voucher' && result.data?.passport && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-500" /><strong>Passport No:</strong> {result.data.passport.passportNumber}</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /><strong>Name:</strong> {result.data.passport.givenName} {result.data.passport.surname}</div>
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
      className="max-w-2xl mx-auto p-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          Scan & Validate
        </h1>
        <p className="text-slate-600">Scan a passport MRZ or enter a voucher code to validate.</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 text-lg" onClick={() => setShowCameraScanner(s => !s)}>
              <Camera className="mr-2" /> {showCameraScanner ? 'Close Camera' : 'Use Camera'}
            </Button>
            <Button variant="outline" className="h-16 text-lg" onClick={() => document.getElementById('manual-input').focus()}>
              <Keyboard className="mr-2" /> Manual Input
            </Button>
          </div>
          <AnimatePresence>
            {showCameraScanner && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div id="qr-reader" className="w-full"></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="manual-input"
              placeholder="Enter code or wait for scanner..."
              className="pl-10 h-14 text-lg"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidation(inputValue)}
              disabled={isProcessing}
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
          <p><strong>USB Scanner:</strong> Simply scan a barcode. The system will treat it as keyboard input and process it automatically.</p>
          <p><strong>Camera:</strong> Click 'Use Camera' and grant permission. Position the QR code or barcode within the frame.</p>
          <p><strong>Manual:</strong> Type or paste the code into the input field and press Enter.</p>
          <p><strong>Note:</strong> This is a frontend simulation. No real data is saved. To integrate a physical OCR device, a backend service would be required to listen on a serial port (like COM29) and forward data, as described in your documentation.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanAndValidate;
