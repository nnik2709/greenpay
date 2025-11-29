import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { recognize } from 'tesseract.js';
import { parseMrz as parseMrzUtil } from '@/lib/mrzParser';

/**
 * LiveMRZScanner - Real-time passport MRZ scanner with live OCR
 *
 * Features:
 * - Live camera feed with continuous OCR scanning
 * - Real-time MRZ detection and validation
 * - Visual alignment guide and feedback
 * - Auto-capture when valid MRZ detected
 * - Fallback to manual capture
 * - File upload option
 */
const LiveMRZScanner = ({ onScanSuccess, onClose }) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, processing, success, error
  const [statusMessage, setStatusMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [ocrWorker, setOcrWorker] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Initialize OCR worker once
  useEffect(() => {
    let worker = null;
    let isActive = true;

    // Using synchronous Tesseract.recognize() instead of worker
    // No initialization needed - ready immediately
    console.log('✅ OCR scanner ready (synchronous mode)');
    setOcrWorker(true);
    setStatusMessage('OCR ready');

    toast({
      title: "✅ OCR Ready",
      description: "Camera scanner ready! Using synchronous mode.",
    });

    return () => {
      isActive = false;
    };
  }, [toast]);

  // Start camera stream
  const startCamera = async () => {
    console.log('🎥 Starting camera...');
    console.log('OCR Worker ready:', !!ocrWorker);

    try {
      const isSecureContext = window.isSecureContext ||
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'https:';

      console.log('Secure context:', isSecureContext);

      if (!isSecureContext) {
        toast({
          title: "Camera Not Available",
          description: "Camera requires HTTPS. Please enter passport details manually.",
          variant: "destructive",
        });
        return;
      }

      if (!ocrWorker) {
        toast({
          title: "OCR Loading",
          description: "Please wait for OCR engine to initialize...",
          variant: "default",
        });
        return;
      }

      console.log('Requesting camera permission...');

      // Show camera UI first, then get stream
      setShowCamera(true);
      setScanStatus('scanning');
      setStatusMessage('Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('Camera stream obtained:', stream);

      // Wait for video element to be mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatusMessage('Position passport MRZ in the frame');

        console.log('Camera started successfully!');

        // Wait for video to load metadata
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting scanning...');
          // Start live scanning after a short delay for camera to stabilize
          setTimeout(() => {
            console.log('Starting live scanning loop...');
            startLiveScanning();
          }, 1000);
        };
      } else {
        console.error('Video ref not available');
        stopCamera();
        toast({
          title: "Camera Error",
          description: "Failed to initialize video element. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

      let errorMessage = "Please allow camera access or enter details manually.";

      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings or enter details manually.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please enter passport details manually.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application. Please close other apps or enter details manually.";
      }

      toast({
        title: "Camera Access Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setShowCamera(false);
      setScanStatus('idle');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setShowCamera(false);
    setScanStatus('idle');
  };

  // Extract MRZ region from video frame
  const extractMRZRegion = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw full frame
    ctx.drawImage(video, 0, 0);

    // Extract bottom 30% of image (where MRZ typically is)
    const mrzHeight = Math.floor(canvas.height * 0.3);
    const mrzY = canvas.height - mrzHeight;

    const mrzCanvas = document.createElement('canvas');
    mrzCanvas.width = canvas.width;
    mrzCanvas.height = mrzHeight;
    const mrzCtx = mrzCanvas.getContext('2d');

    mrzCtx.drawImage(
      canvas,
      0, mrzY, canvas.width, mrzHeight,
      0, 0, mrzCanvas.width, mrzCanvas.height
    );

    return mrzCanvas.toDataURL('image/jpeg', 0.9);
  };

  // Start live scanning loop
  const startLiveScanning = () => {
    if (!ocrWorker) {
      setStatusMessage('Waiting for OCR to load...');
      return;
    }

    // Scan every 2 seconds
    scanIntervalRef.current = setInterval(async () => {
      if (scanStatus === 'processing' || scanStatus === 'success') {
        return; // Skip if already processing or succeeded
      }

      try {
        const mrzImage = extractMRZRegion();
        if (!mrzImage) return;

        setScanStatus('processing');
        setStatusMessage('Analyzing...');

        // Perform OCR on MRZ region
        // Use synchronous recognize() instead of worker
        const { data: { text } } = await recognize(mrzImage, 'eng', {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        });

        // Try to extract MRZ
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const mrzLines = lines.filter(line =>
          line.startsWith('P<') ||
          (line.includes('<') && line.replace(/[^<]/g, '').length > 10)
        );

        if (mrzLines.length >= 2) {
          // Found potential MRZ
          const mrzLine1 = mrzLines[mrzLines.length - 2].replace(/\s/g, '');
          const mrzLine2 = mrzLines[mrzLines.length - 1].replace(/\s/g, '');
          const mrzString = mrzLine1 + mrzLine2;

          // Validate MRZ
          const parseResult = parseMrzUtil(mrzString);

          if (parseResult.success) {
            // Valid MRZ detected!
            setScanStatus('success');
            setStatusMessage('✓ Passport detected! Populating form...');

            // Stop scanning immediately
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }

            // Success feedback
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            const passportData = {
              passportNumber: parseResult.passportNumber,
              surname: parseResult.surname,
              givenName: parseResult.givenName,
              nationality: parseResult.nationality,
              dob: parseResult.dob,
              sex: parseResult.sex,
              dateOfExpiry: parseResult.dateOfExpiry,
            };

            toast({
              title: "✓ Scan Successful",
              description: `Passport ${passportData.passportNumber} detected. Populating form...`,
            });

            // Immediately close camera and populate form
            stopCamera();
            onScanSuccess(passportData);

          } else {
            // Invalid MRZ, continue scanning
            setScanStatus('scanning');
            setStatusMessage('Adjust passport position - MRZ not clear');
          }
        } else {
          // No MRZ found yet
          setScanStatus('scanning');
          setStatusMessage('Position passport MRZ in the frame');
        }

      } catch (error) {
        console.error('Live scan error:', error);
        setScanStatus('scanning');
        setStatusMessage('Searching for MRZ...');
      }
    }, 2000); // Scan every 2 seconds
  };


  // Get status color
  const getStatusColor = () => {
    switch (scanStatus) {
      case 'scanning': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning': return <Focus className="w-5 h-5 animate-pulse" />;
      case 'processing': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Camera className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Camera className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Live MRZ Scanner</h3>
            <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
              <li><strong>Auto-detection:</strong> Camera continuously scans for MRZ</li>
              <li><strong>Position passport:</strong> Align MRZ (bottom 2 lines) in green frame</li>
              <li><strong>Hold steady:</strong> Keep passport still - auto-captures when detected</li>
              <li><strong>Good lighting:</strong> Ensure MRZ is well-lit and clear</li>
            </ul>
          </div>
        </div>
      </div>

      {/* OCR Loading Status */}
      {!ocrWorker && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <div>
              <p className="font-medium text-yellow-900">Loading OCR Engine...</p>
              <p className="text-sm text-yellow-700">Please wait a few seconds for initialization.</p>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Options (if not scanning) */}
      {!showCamera && scanStatus !== 'processing' && (
        <div className="flex justify-center">
          <Button
            onClick={startCamera}
            className="h-24 w-full max-w-md text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!ocrWorker}
          >
            {ocrWorker ? (
              <>
                <Camera className="w-6 h-6 mr-2" />
                <div>
                  <div className="font-bold">Start Camera Scan</div>
                  <div className="text-xs opacity-90">Auto-detect passport MRZ</div>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                <div>
                  <div className="font-bold">Initializing...</div>
                  <div className="text-xs opacity-90">Loading OCR</div>
                </div>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Camera View with Live Scanning */}
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

            {/* Status Overlay */}
            <div className="absolute top-4 left-4 right-4">
              <div className={`bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="font-medium text-white">{statusMessage}</span>
              </div>
            </div>

            {/* MRZ Alignment Guide */}
            <div className="absolute inset-0 flex items-end pb-20 pointer-events-none">
              <div className={`w-full mx-8 h-32 border-4 rounded-lg flex items-center justify-center transition-colors ${
                scanStatus === 'success' ? 'border-green-400' :
                scanStatus === 'processing' ? 'border-yellow-400' :
                'border-emerald-400'
              } border-dashed`}>
                <span className={`px-4 py-2 rounded text-sm font-medium ${
                  scanStatus === 'success' ? 'bg-green-900/80 text-green-100' :
                  scanStatus === 'processing' ? 'bg-yellow-900/80 text-yellow-100' :
                  'bg-emerald-900/80 text-emerald-100'
                }`}>
                  {scanStatus === 'success' ? '✓ MRZ Detected!' :
                   scanStatus === 'processing' ? 'Analyzing...' :
                   'Position MRZ (bottom 2 lines) here'}
                </span>
              </div>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
              {scanStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-green-500 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={stopCamera}
            variant="outline"
            className="w-full h-14"
          >
            <X className="w-5 h-5 mr-2" />
            Stop Camera
          </Button>
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
            onClick={() => {
              setScanResult(null);
              setScanStatus('idle');
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Try Again
          </Button>
        )}
        {scanResult?.type === 'success' && (
          <Button
            onClick={() => {
              stopCamera();
              onScanSuccess(scanResult.data);
            }}
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

export default LiveMRZScanner;
