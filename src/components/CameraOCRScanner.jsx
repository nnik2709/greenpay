import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createWorker } from 'tesseract.js';
import { parseMrz as parseMrzUtil } from '@/lib/mrzParser';

/**
 * CameraOCRScanner - Advanced passport MRZ scanner using OCR
 *
 * This component uses Tesseract.js to perform OCR on passport images
 * to extract MRZ (Machine Readable Zone) data.
 *
 * Features:
 * - Camera capture for live scanning
 * - File upload for existing photos
 * - OCR processing with Tesseract.js
 * - Automatic MRZ parsing
 * - Visual feedback and progress tracking
 */
const CameraOCRScanner = ({ onScanSuccess, onClose }) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera stream
  const startCamera = async () => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext ||
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'https:';

      if (!isSecureContext) {
        toast({
          title: "Camera Not Available",
          description: "Camera access requires HTTPS. Please use file upload or visit via HTTPS.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access or use file upload instead.",
        variant: "destructive",
      });
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageDataUrl);
    stopCamera();
    processImage(imageDataUrl);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      setCapturedImage(imageDataUrl);
      processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process image with OCR
  const processImage = async (imageDataUrl) => {
    setIsScanning(true);
    setScanResult(null);
    setOcrProgress(0);
    setOcrStatus('Initializing OCR...');

    let worker = null;

    try {
      // Create Tesseract worker
      worker = await createWorker({
        logger: (m) => {
          console.log('OCR:', m);
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setOcrProgress(progress);
            setOcrStatus(`Scanning passport (${progress}%)...`);
          }
        }
      });

      setOcrStatus('Loading language data...');
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Configure for MRZ scanning
      // MRZ uses specific fonts and characters
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        tessedit_pageseg_mode: '6', // Assume uniform block of text
      });

      setOcrStatus('Extracting MRZ text...');

      // Perform OCR
      const { data: { text } } = await worker.recognize(imageDataUrl);

      console.log('OCR Result:', text);

      // Extract MRZ lines (last 2 lines of passport)
      // MRZ format: 2 lines × 44 characters = 88 characters
      const lines = text.split('\n').filter(line => line.trim().length > 0);

      // Find lines that look like MRZ (start with P< or contain mostly <)
      const mrzLines = lines.filter(line =>
        line.startsWith('P<') ||
        (line.includes('<') && line.replace(/[^<]/g, '').length > 10)
      );

      if (mrzLines.length < 2) {
        throw new Error('Could not find MRZ lines. Please ensure the bottom of the passport is clearly visible.');
      }

      // Take last 2 lines (MRZ is at bottom)
      const mrzLine1 = mrzLines[mrzLines.length - 2].replace(/\s/g, '');
      const mrzLine2 = mrzLines[mrzLines.length - 1].replace(/\s/g, '');
      const mrzString = mrzLine1 + mrzLine2;

      console.log('Extracted MRZ:', mrzString);

      // Parse MRZ using centralized parser
      const parseResult = parseMrzUtil(mrzString);

      if (!parseResult.success) {
        throw new Error(parseResult.message || 'Failed to parse MRZ data');
      }

      // Success!
      const passportData = {
        passportNumber: parseResult.passportNumber,
        surname: parseResult.surname,
        givenName: parseResult.givenName,
        nationality: parseResult.nationality,
        dob: parseResult.dob,
        sex: parseResult.sex,
        dateOfExpiry: parseResult.dateOfExpiry,
      };

      setScanResult({
        type: 'success',
        data: passportData,
        message: 'Passport MRZ scanned successfully!'
      });

      toast({
        title: "Scan Successful",
        description: `Passport details for ${passportData.givenName} ${passportData.surname} extracted.`,
      });

      // Auto-proceed after delay
      setTimeout(() => {
        onScanSuccess(passportData);
      }, 2000);

    } catch (error) {
      console.error('OCR Error:', error);

      setScanResult({
        type: 'error',
        message: error.message || 'Failed to scan passport. Please try again with better lighting.'
      });

      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsScanning(false);
      setOcrProgress(0);
      setOcrStatus('');
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setCapturedImage(null);
    setScanResult(null);
    stopCamera();
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Camera className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">How to Scan Passport MRZ</h3>
            <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
              <li><strong>Good lighting:</strong> Ensure the passport is well-lit without glare</li>
              <li><strong>Focus on MRZ:</strong> Capture the bottom 2 lines (machine readable zone)</li>
              <li><strong>Hold steady:</strong> Keep the camera still to avoid blur</li>
              <li><strong>Clear photo:</strong> MRZ text must be sharp and readable</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanner Options */}
      {!capturedImage && !showCamera && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={startCamera}
            className="h-24 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            disabled={isScanning}
          >
            <Camera className="w-6 h-6 mr-2" />
            <div>
              <div className="font-bold">Use Camera</div>
              <div className="text-xs opacity-90">Take a photo</div>
            </div>
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-24 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isScanning}
          >
            <Upload className="w-6 h-6 mr-2" />
            <div>
              <div className="font-bold">Upload Photo</div>
              <div className="text-xs opacity-90">Choose from gallery</div>
            </div>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-8 bottom-1/4 h-32 border-2 border-emerald-400 border-dashed rounded-lg flex items-center justify-center">
                <span className="bg-emerald-900/80 text-emerald-100 px-3 py-1 rounded text-sm">
                  Align MRZ (bottom 2 lines) here
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={capturePhoto}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              className="h-14"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && !isScanning && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-slate-200">
            <img src={capturedImage} alt="Captured passport" className="w-full" />
          </div>

          {!scanResult && (
            <Button
              onClick={resetScanner}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* OCR Progress */}
      {isScanning && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
            <div>
              <p className="font-medium text-slate-900">{ocrStatus}</p>
              {ocrProgress > 0 && (
                <div className="mt-3 w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${ocrProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium mb-2 ${
                  scanResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message}
                </p>
                {scanResult.data && (
                  <div className="space-y-1 text-sm text-green-700 bg-white/50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Given Name:</strong> {scanResult.data.givenName}</div>
                      <div><strong>Surname:</strong> {scanResult.data.surname}</div>
                      <div><strong>Passport No:</strong> {scanResult.data.passportNumber}</div>
                      <div><strong>Nationality:</strong> {scanResult.data.nationality}</div>
                      <div><strong>Date of Birth:</strong> {scanResult.data.dob}</div>
                      <div><strong>Sex:</strong> {scanResult.data.sex}</div>
                      <div><strong>Expiry Date:</strong> {scanResult.data.dateOfExpiry}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {scanResult?.type === 'error' && (
          <Button
            onClick={resetScanner}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Try Again
          </Button>
        )}
        {scanResult?.type === 'success' && (
          <Button
            onClick={() => onScanSuccess(scanResult.data)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Use Scanned Data
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraOCRScanner;
