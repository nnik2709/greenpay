import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Flashlight, FlashlightOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Tesseract from 'tesseract.js';

/**
 * Simple Camera Scanner - Uses native HTML5 video/camera
 * Fallback for when html5-qrcode doesn't work
 */
const SimpleCameraScanner = ({ onScanSuccess, onClose }) => {
  const { toast } = useToast();
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [mrzDetected, setMrzDetected] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          zoom: { ideal: 2 }, // Request 2x zoom if supported
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setIsCameraActive(true);

      // Check if flash/torch is supported
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        setFlashSupported(true);
      }

      // Start MRZ detection
      startMrzDetection();

      toast({
        title: "Camera Active",
        description: "Align MRZ in green box - it will turn bright green when ready",
      });
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Access Denied",
        description: error.message || "Please allow camera access in your browser settings",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setMrzDetected(false);
    setIsFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!stream || !flashSupported) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      });
      setIsFlashOn(!isFlashOn);
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast({
        title: "Flash Not Available",
        description: "Your device may not support camera flash",
        variant: "destructive",
      });
    }
  };

  // Real-time MRZ detection
  const startMrzDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      detectMrzInFrame();
    }, 500); // Check every 500ms
  };

  const detectMrzInFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    // Sample the MRZ area
    const cropHeight = videoHeight * 0.3;
    const cropWidth = videoWidth * 0.9;
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = videoHeight * 0.35;

    // Draw small sample to canvas
    canvas.width = 200; // Small sample for quick analysis
    canvas.height = 60;

    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, 200, 60
    );

    // Analyze image data for MRZ-like patterns
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasHighContrast = analyzeImageForMrz(imageData);

    setMrzDetected(hasHighContrast);
  };

  const analyzeImageForMrz = (imageData) => {
    const data = imageData.data;
    let totalBrightness = 0;
    let darkPixels = 0;
    let brightPixels = 0;

    // Analyze pixel brightness
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;

      if (brightness < 100) darkPixels++;
      if (brightness > 200) brightPixels++;
    }

    const avgBrightness = totalBrightness / (data.length / 4);
    const contrastRatio = Math.abs(darkPixels - brightPixels) / (data.length / 4);

    // MRZ typically has good contrast (dark text on light background)
    // Look for high contrast and reasonable brightness
    return contrastRatio > 0.15 && avgBrightness > 100 && avgBrightness < 220;
  };

  // Parse MRZ text extracted from OCR
  const parseMRZ = (text) => {
    try {
      // Clean up text - remove spaces, newlines
      const cleanedText = text.replace(/\s/g, '').replace(/[^A-Z0-9<]/g, '');

      // Find MRZ pattern - starts with P< and is 88 characters total (2 lines of 44)
      const mrzMatch = cleanedText.match(/P<[A-Z<]{41,44}[A-Z0-9<]{41,44}/);

      if (!mrzMatch) {
        throw new Error('Could not find valid MRZ pattern in image');
      }

      const mrz = mrzMatch[0];
      if (mrz.length < 88) {
        throw new Error('MRZ data incomplete');
      }

      const line1 = mrz.substring(0, 44);
      const line2 = mrz.substring(44, 88);

      // Parse line 1: P<COUNTRYNAME<<GIVENNAMES<<<
      const names = line1.substring(5).split('<<');
      const surname = names[0].replace(/</g, ' ').trim();
      const givenName = names.slice(1).join(' ').replace(/</g, ' ').trim();

      // Parse line 2: PASSPORTNUMBER<NATIONALITY<DOBYYMMDDSEXEXPIRYYYMMDD<
      const passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
      const nationality = line2.substring(10, 13);

      const dobRaw = line2.substring(13, 19);
      let dobYear = parseInt(dobRaw.substring(0, 2), 10);
      dobYear += (dobYear > (new Date().getFullYear() % 100)) ? 1900 : 2000;
      const dateOfBirth = `${dobYear}-${dobRaw.substring(2, 4)}-${dobRaw.substring(4, 6)}`;

      const sex = line2.substring(20, 21) === 'M' ? 'Male' : 'Female';

      const expiryRaw = line2.substring(21, 27);
      let expiryYear = parseInt(expiryRaw.substring(0, 2), 10);
      expiryYear += (expiryYear > 50) ? 1900 : 2000;
      const dateOfExpiry = `${expiryYear}-${expiryRaw.substring(2, 4)}-${expiryRaw.substring(4, 6)}`;

      return {
        passportNumber,
        surname,
        givenName,
        nationality,
        dateOfBirth,
        sex,
        dateOfExpiry
      };
    } catch (error) {
      throw new Error('Failed to parse MRZ: ' + error.message);
    }
  };

  const processImageWithOCR = async (imageDataUrl) => {
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      toast({
        title: "Processing Image",
        description: "Reading MRZ data from passport...",
      });

      const result = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        }
      );

      const extractedText = result.data.text;
      console.log('OCR Text:', extractedText);
      console.log('OCR Confidence:', result.data.confidence);

      // Parse MRZ from extracted text
      const passportData = parseMRZ(extractedText);

      toast({
        title: "Success!",
        description: `Passport details extracted for ${passportData.givenName} ${passportData.surname}`,
      });

      // Auto-fill the form
      setTimeout(() => {
        onScanSuccess(passportData);
      }, 1000);

    } catch (error) {
      console.error('OCR/Parse error:', error);
      toast({
        title: "Could Not Read MRZ",
        description: "Try again with better lighting, or enter manually. Make sure MRZ lines fill the green guide box.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate MRZ crop area (bottom 30% of frame, centered)
    const cropHeight = videoHeight * 0.3; // MRZ area height
    const cropWidth = videoWidth * 0.9;   // 90% width for margins
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = videoHeight * 0.35; // Start from 35% down

    // Set canvas to cropped size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw only the MRZ region
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source rectangle (MRZ area)
      0, 0, cropWidth, cropHeight            // Destination rectangle (full canvas)
    );

    // Enhance contrast for better OCR
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple contrast enhancement
    const factor = 1.5;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, (data[i] - 128) * factor + 128);     // R
      data[i + 1] = Math.min(255, (data[i + 1] - 128) * factor + 128); // G
      data[i + 2] = Math.min(255, (data[i + 2] - 128) * factor + 128); // B
    }
    context.putImageData(imageData, 0, 0);

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageDataUrl);

    stopCamera();

    // Automatically process with OCR
    processImageWithOCR(imageDataUrl);
  };

  const handleManualEntry = () => {
    toast({
      title: "Manual Entry",
      description: "Please fill in the passport details manually",
    });
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Camera Scanner</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-bold text-emerald-900 mb-2">📷 How to Scan</h3>
        <ol className="text-emerald-800 text-sm space-y-1 list-decimal list-inside">
          <li>Click "Start Camera" to activate your camera</li>
          <li><strong>Position the passport MRZ (bottom 2 lines) inside the green guide box</strong></li>
          <li>Align the 2 MRZ lines with the dashed lines in the guide</li>
          <li>Use good lighting and hold phone steady</li>
          <li>Click "Capture Image" - OCR will auto-read the data</li>
        </ol>
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        {!isCameraActive && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p>Click "Start Camera" below to begin</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-auto ${isCameraActive ? 'block' : 'hidden'}`}
          style={{ maxHeight: '500px', objectFit: 'contain' }}
        />

        {/* MRZ Guide Overlay - shown when camera is active */}
        {isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dark overlay with cutout */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />

            {/* MRZ Guide Box */}
            <div className="relative z-10" style={{ width: '90%', height: '30%' }}>
              {/* Guide rectangle - changes color when MRZ detected */}
              <div
                className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                  mrzDetected
                    ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
                    : 'border-emerald-400'
                }`}
                style={{
                  boxShadow: mrzDetected
                    ? '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.6)'
                    : '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  background: mrzDetected ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                }}
              >
                {/* Corner markers */}
                <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />

                {/* Instructions */}
                <div className="absolute -top-12 left-0 right-0 text-center">
                  <p className={`text-white text-sm font-bold px-3 py-1 rounded inline-block transition-colors ${
                    mrzDetected ? 'bg-green-500 animate-pulse' : 'bg-emerald-600'
                  }`}>
                    {mrzDetected ? '✓ Ready! Tap Capture' : 'Position MRZ lines here'}
                  </p>
                </div>

                {/* MRZ line guides */}
                <div className="absolute inset-0 flex flex-col justify-center px-4">
                  <div className={`border-t-2 border-dashed opacity-70 mb-2 transition-colors ${
                    mrzDetected ? 'border-green-300' : 'border-emerald-300'
                  }`} />
                  <div className={`border-t-2 border-dashed opacity-70 transition-colors ${
                    mrzDetected ? 'border-green-300' : 'border-emerald-300'
                  }`} />
                </div>
              </div>
            </div>

            {/* Flash Toggle Button - pointer-events-auto to make it clickable */}
            {flashSupported && (
              <div className="absolute top-4 right-4 pointer-events-auto">
                <button
                  onClick={toggleFlash}
                  className={`p-3 rounded-full transition-colors ${
                    isFlashOn
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isFlashOn ? (
                    <Flashlight className="w-6 h-6" />
                  ) : (
                    <FlashlightOff className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured passport"
            className="w-full h-auto"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
          />
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {!isCameraActive && !capturedImage && (
          <Button
            onClick={startCamera}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isProcessing}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        )}

        {isCameraActive && (
          <>
            <Button
              onClick={captureImage}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing}
            >
              Capture Image
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </>
        )}

        {capturedImage && !isProcessing && (
          <>
            <Button
              onClick={handleManualEntry}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Continue with Manual Entry
            </Button>
            <Button
              onClick={() => {
                setCapturedImage(null);
                startCamera();
              }}
              variant="outline"
              className="w-full"
            >
              Retake Photo
            </Button>
          </>
        )}
      </div>

      {/* OCR Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-center font-semibold mb-2">Reading Passport...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-slate-600 mt-2">{ocrProgress}%</p>
          </div>
        </div>
      )}

      {/* Manual Entry Option */}
      <div className="border-t pt-4">
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full"
          disabled={isProcessing}
        >
          Skip Camera - Enter Details Manually
        </Button>
      </div>
    </div>
  );
};

export default SimpleCameraScanner;
