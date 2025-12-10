import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
      setIsCameraActive(true);

      toast({
        title: "Camera Active",
        description: "Position passport so MRZ (bottom 2 lines) are visible, then capture",
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
    setIsCameraActive(false);
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
        }
      );

      const extractedText = result.data.text;
      console.log('OCR Text:', extractedText);

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
        description: "Please enter details manually or retake with better lighting and focus on the bottom 2 lines of passport",
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

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">Instructions</h3>
        <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
          <li>Click "Start Camera" to activate your camera</li>
          <li>Position passport so the bottom 2 lines (MRZ) are clearly visible</li>
          <li>Ensure good lighting and hold steady</li>
          <li>Click "Capture Image" when ready</li>
          <li>Enter the details manually from the captured image</li>
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
