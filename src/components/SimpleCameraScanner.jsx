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
          height: { ideal: 1080 }
          // No zoom - let user position passport naturally
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
        title: "📷 Camera Active",
        description: "Position passport MRZ (bottom 2 lines) in the guide box",
        duration: 3000,
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
    const width = imageData.width;
    const height = imageData.height;

    let totalBrightness = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    let edgeCount = 0;

    // Analyze pixel brightness and edge detection
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;

      if (brightness < 80) darkPixels++;
      if (brightness > 220) brightPixels++;

      // Edge detection - check horizontal changes (text has lots of edges)
      if (i > 4 && i % (width * 4) !== 0) {
        const prevBrightness = (data[i-4] + data[i-3] + data[i-2]) / 3;
        if (Math.abs(brightness - prevBrightness) > 60) {
          edgeCount++;
        }
      }
    }

    const totalPixels = data.length / 4;
    const avgBrightness = totalBrightness / totalPixels;
    const darkRatio = darkPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    const edgeRatio = edgeCount / totalPixels;

    // MRZ should have:
    // - High edge density (lots of text characters)
    // - Good amount of dark pixels (text) and bright pixels (background)
    // - Average brightness suggesting good lighting
    const hasTextPattern = edgeRatio > 0.25; // Lots of edges from text
    const hasGoodContrast = darkRatio > 0.1 && brightRatio > 0.3;
    const hasGoodLighting = avgBrightness > 130 && avgBrightness < 200;

    console.log('MRZ Analysis:', {
      edgeRatio: edgeRatio.toFixed(3),
      darkRatio: darkRatio.toFixed(3),
      brightRatio: brightRatio.toFixed(3),
      avgBrightness: avgBrightness.toFixed(1),
      detected: hasTextPattern && hasGoodContrast && hasGoodLighting
    });

    return hasTextPattern && hasGoodContrast && hasGoodLighting;
  };

  // Parse MRZ text extracted from OCR
  const parseMRZ = (text) => {
    try {
      console.log('=== PARSING MRZ ===');
      console.log('Original text:', text);

      // Clean up text - remove spaces, newlines, and non-MRZ characters
      // OCR often mistakes characters: I->1, O->0, S->5, etc.
      let cleanedText = text
        .toUpperCase()
        .replace(/\s/g, '')
        .replace(/[^A-Z0-9<]/g, '');

      console.log('Cleaned text:', cleanedText);
      console.log('Cleaned text length:', cleanedText.length);

      // Try to find MRZ pattern - look for P< at the start
      let mrzStart = cleanedText.indexOf('P<');
      if (mrzStart === -1) {
        // Try common OCR mistakes for P<
        mrzStart = cleanedText.indexOf('P«');
        if (mrzStart === -1) mrzStart = cleanedText.indexOf('P‹');
        if (mrzStart === -1) throw new Error('Could not find MRZ start marker (P<)');
        cleanedText = cleanedText.substring(0, mrzStart) + 'P<' + cleanedText.substring(mrzStart + 2);
      }

      // Extract 88 characters starting from P<
      const mrz = cleanedText.substring(mrzStart, mrzStart + 88);
      console.log('Extracted MRZ (88 chars):', mrz);
      console.log('MRZ length:', mrz.length);

      if (mrz.length < 88) {
        throw new Error(`MRZ too short: only ${mrz.length} characters found, need 88`);
      }

      const line1 = mrz.substring(0, 44);
      const line2 = mrz.substring(44, 88);

      console.log('Line 1 (44 chars):', line1);
      console.log('Line 2 (44 chars):', line2);

      // Parse line 1: P<ISSCOUNTRY<SURNAME<<GIVENNAMES<<<
      const line1Content = line1.substring(5); // Remove P<XXX
      const nameParts = line1Content.split('<<');

      console.log('Name parts:', nameParts);

      const surname = nameParts[0].replace(/</g, '').trim();
      // Given name is everything after the first <<, remove all < and extra spaces
      const givenName = nameParts.slice(1)
        .join(' ')
        .replace(/</g, '')
        .replace(/\s+/g, ' ')
        .trim();

      console.log('Parsed surname:', surname);
      console.log('Parsed given name:', givenName);

      // Parse line 2: PASSPORTNUMBER<NATIONALITY<DOBYYMMDDSEXEXPIRYYYMMDD<
      const passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
      const nationality = line2.substring(10, 13).replace(/</g, '').trim();

      const dobRaw = line2.substring(13, 19);
      const sexChar = line2.substring(20, 21);
      const expiryRaw = line2.substring(21, 27);

      console.log('Passport Number:', passportNumber);
      console.log('Nationality:', nationality);
      console.log('DOB raw:', dobRaw);
      console.log('Sex char:', sexChar);
      console.log('Expiry raw:', expiryRaw);

      // Parse date of birth
      let dobYear = parseInt(dobRaw.substring(0, 2), 10);
      if (isNaN(dobYear)) throw new Error('Invalid birth year');
      dobYear += (dobYear > (new Date().getFullYear() % 100)) ? 1900 : 2000;
      const dateOfBirth = `${dobYear}-${dobRaw.substring(2, 4)}-${dobRaw.substring(4, 6)}`;

      // Parse sex - be strict about M/F
      const sex = (sexChar === 'M' || sexChar === 'H') ? 'Male' : 'Female';

      // Parse expiry date
      let expiryYear = parseInt(expiryRaw.substring(0, 2), 10);
      if (isNaN(expiryYear)) throw new Error('Invalid expiry year');
      expiryYear += (expiryYear > 50) ? 1900 : 2000;
      const dateOfExpiry = `${expiryYear}-${expiryRaw.substring(2, 4)}-${expiryRaw.substring(4, 6)}`;

      const result = {
        passportNumber,
        surname,
        givenName,
        nationality,
        dateOfBirth,
        sex,
        dateOfExpiry
      };

      console.log('=== PARSED RESULT ===');
      console.log(JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('MRZ parsing failed:', error);
      throw new Error('Failed to parse MRZ: ' + error.message);
    }
  };

  const processImageWithOCR = async (imageDataUrl) => {
    console.log('=== STARTING OCR PROCESSING ===');
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // Step 1: Starting OCR
      toast({
        title: "⏳ Step 1/3: Starting OCR",
        description: "Analyzing passport image...",
      });

      console.log('Calling Tesseract.recognize...');
      const result = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: (m) => {
            console.log('Tesseract:', m);
            if (m.status === 'recognizing text') {
              const progress = Math.round(m.progress * 100);
              setOcrProgress(progress);

              // Update toast at key milestones
              if (progress === 25 || progress === 50 || progress === 75) {
                toast({
                  title: `⏳ Step 2/3: Reading Text (${progress}%)`,
                  description: "Extracting MRZ data...",
                });
              }
            }
          },
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        }
      );

      const extractedText = result.data.text;
      console.log('=== OCR COMPLETE ===');
      console.log('OCR Text:', extractedText);
      console.log('OCR Confidence:', result.data.confidence);
      console.log('Text length:', extractedText.length);

      if (!extractedText || extractedText.length < 20) {
        throw new Error('❌ No text found in image. Please retake with better lighting.');
      }

      // Step 3: Parsing MRZ
      toast({
        title: "⏳ Step 3/3: Parsing Data",
        description: "Extracting passport details...",
      });

      console.log('Attempting to parse MRZ...');
      const passportData = parseMRZ(extractedText);
      console.log('✅ MRZ parsed successfully:', passportData);

      // Success!
      toast({
        title: "✅ Success!",
        description: `Data extracted: ${passportData.givenName} ${passportData.surname}`,
        className: "bg-green-50 border-green-200",
      });

      // Auto-fill the form
      setTimeout(() => {
        console.log('✅ CALLING onScanSuccess with passport data:', passportData);
        onScanSuccess(passportData);
        console.log('✅ onScanSuccess called - form should populate now');
      }, 1000);

    } catch (error) {
      console.error('=== ❌ OCR/Parse ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);

      toast({
        title: "❌ OCR Failed",
        description: error.message || "Could not read MRZ. Please try again or enter manually.",
        variant: "destructive",
        duration: 5000,
      });

      // Don't clear captured image so user can retry or enter manually
      setIsProcessing(false);
      setOcrProgress(0);
      return; // Don't reset capturedImage
    }

    setIsProcessing(false);
    setOcrProgress(0);
  };

  const captureImage = () => {
    console.log('=== CAPTURE IMAGE CALLED ===');
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    console.log('Video dimensions:', videoWidth, 'x', videoHeight);

    // Calculate MRZ crop area (bottom 30% of frame, centered)
    const cropHeight = videoHeight * 0.3; // MRZ area height
    const cropWidth = videoWidth * 0.9;   // 90% width for margins
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = videoHeight * 0.35; // Start from 35% down

    console.log('Crop area:', { cropX, cropY, cropWidth, cropHeight });

    // Set canvas to cropped size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw only the MRZ region
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source rectangle (MRZ area)
      0, 0, cropWidth, cropHeight            // Destination rectangle (full canvas)
    );

    console.log('Image drawn to canvas');

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

    console.log('Contrast enhanced');

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    console.log('Image data URL created, length:', imageDataUrl.length);

    setCapturedImage(imageDataUrl);
    console.log('Captured image state set');

    stopCamera();
    console.log('Camera stopped');

    // Automatically process with OCR
    console.log('Calling processImageWithOCR...');
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
        <h2 className="text-2xl font-bold text-slate-800">Scan Passport</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
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
                <div className="absolute -top-16 left-0 right-0 text-center">
                  <p className={`text-white text-base font-bold px-4 py-2 rounded-lg inline-block transition-all shadow-lg ${
                    mrzDetected ? 'bg-green-500 animate-pulse scale-110' : 'bg-slate-700'
                  }`}>
                    {mrzDetected ? '✅ READY - TAP CAPTURE NOW!' : 'Align MRZ (bottom 2 lines)'}
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
