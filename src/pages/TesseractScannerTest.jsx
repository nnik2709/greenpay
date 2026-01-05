import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Tesseract from 'tesseract.js';
import { parse as parseMRZ } from 'mrz';

/**
 * Tesseract.js + mrz Open Source Scanner Test Page
 *
 * Tests open source alternative to Dynamsoft MRZ Scanner
 * - Tesseract.js for OCR
 * - mrz library for parsing
 * - Camera + file upload support
 *
 * NO payment or voucher generation - just scanning and parsing test
 */

const TesseractScannerTest = () => {
  const { toast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [rawOCR, setRawOCR] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraActive(true); // Set this first to render video element

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Wait for next tick to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);

        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded:', {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            readyState: videoRef.current.readyState
          });

          // Ensure video plays
          try {
            await videoRef.current.play();
            console.log('Video playing');
          } catch (playErr) {
            console.log('Video play error (may autoplay):', playErr);
          }
        };

        console.log('Camera stream assigned:', {
          tracks: mediaStream.getTracks().length,
          trackSettings: mediaStream.getVideoTracks()[0]?.getSettings()
        });

        toast({
          title: 'Camera Started',
          description: 'Position passport MRZ in view and capture',
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraActive(false);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: err.message || 'Failed to access camera',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and process
    canvas.toBlob(blob => {
      if (blob) {
        processImage(blob, 'camera');
      }
    }, 'image/jpeg', 0.95);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file, 'upload');
    }
  };

  // Process image with Tesseract OCR
  const processImage = async (imageBlob, source) => {
    setProcessing(true);
    setOcrProgress(0);
    setRawOCR('');
    setParsedData(null);
    setResult(null);

    const startTime = Date.now();

    try {
      // Run Tesseract OCR
      const { data } = await Tesseract.recognize(
        imageBlob,
        'eng', // Language: English
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const ocrText = data.text;
      setRawOCR(ocrText);

      console.log('OCR Text:', ocrText);

      // Try to extract MRZ lines (last 2-3 lines typically)
      const lines = ocrText.split('\n').filter(line => line.trim().length > 0);

      // MRZ lines are typically 44 characters long for passports
      // Clean and extract exactly 44 characters
      const mrzLines = lines
        .map(line => {
          // Remove spaces and keep only valid MRZ characters
          const cleaned = line.replace(/\s/g, '').toUpperCase();
          // MRZ valid characters: A-Z, 0-9, <
          const mrzOnly = cleaned.replace(/[^A-Z0-9<]/g, '');
          return mrzOnly;
        })
        .filter(line => line.length >= 40 && line.length <= 50);

      console.log('Potential MRZ lines:', mrzLines);

      if (mrzLines.length >= 2) {
        // Take last 2 lines and truncate to exactly 44 characters
        const mrzText = mrzLines.slice(-2).map(line => {
          // TD3 (passport) format is exactly 44 characters per line
          if (line.length > 44) {
            return line.substring(0, 44);
          } else if (line.length < 44) {
            // Pad with < if too short
            return line.padEnd(44, '<');
          }
          return line;
        });

        try {
          // Parse MRZ with mrz library
          const parsed = parseMRZ(mrzText, { autocorrect: true });

          console.log('Parsed MRZ:', parsed);
          console.log('Extracted Fields:', {
            passportNumber: parsed.fields.documentNumber,
            lastName: parsed.fields.lastName,
            firstName: parsed.fields.firstName,
            nationality: parsed.fields.issuingState,
            birthDate: parsed.fields.birthDate,
            sex: parsed.fields.sex,
            expiryDate: parsed.fields.expirationDate,
            valid: parsed.valid
          });
          setParsedData(parsed);

          const scanRecord = {
            timestamp: new Date().toISOString(),
            source,
            processingTime: `${processingTime}s`,
            success: parsed.valid,
            fields: parsed.fields
          };

          setScanHistory(prev => [scanRecord, ...prev.slice(0, 4)]);

          if (parsed.valid) {
            setResult({
              success: true,
              message: `Passport scanned successfully in ${processingTime}s`,
              data: parsed.fields
            });

            toast({
              title: 'Success!',
              description: `Passport parsed in ${processingTime}s`,
            });
          } else {
            setResult({
              success: false,
              message: 'MRZ parsed with errors - see details below',
              errors: parsed.details?.filter(d => !d.valid)
            });

            toast({
              variant: 'destructive',
              title: 'Validation Errors',
              description: 'MRZ parsed but has validation errors',
            });
          }
        } catch (parseErr) {
          console.error('MRZ parsing error:', parseErr);
          setResult({
            success: false,
            message: 'Failed to parse MRZ format',
            error: parseErr.message
          });

          toast({
            variant: 'destructive',
            title: 'Parse Error',
            description: parseErr.message,
          });
        }
      } else {
        setResult({
          success: false,
          message: 'No MRZ detected in image',
          hint: 'Try capturing just the bottom of the passport with the 2 MRZ lines'
        });

        toast({
          variant: 'destructive',
          title: 'No MRZ Found',
          description: 'Could not detect MRZ lines in image',
        });
      }

    } catch (err) {
      console.error('OCR error:', err);
      setResult({
        success: false,
        message: 'OCR failed',
        error: err.message
      });

      toast({
        variant: 'destructive',
        title: 'OCR Error',
        description: err.message,
      });
    } finally {
      setProcessing(false);
      setOcrProgress(0);

      // Stop camera after capture
      if (source === 'camera') {
        stopCamera();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Camera className="h-6 w-6 text-emerald-600" />
              Tesseract.js + mrz Scanner Test
            </CardTitle>
            <CardDescription>
              Open source alternative to Dynamsoft - Testing OCR accuracy and speed
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Scanner Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {!cameraActive ? (
                <Button
                  onClick={startCamera}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={processing}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={processing}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture & Scan
                  </Button>
                  <Button
                    onClick={stopCamera}
                    size="lg"
                    variant="outline"
                    disabled={processing}
                  >
                    Stop Camera
                  </Button>
                </>
              )}

              <Button
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                variant="outline"
                disabled={processing}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Camera View */}
            {cameraActive && (
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto object-contain"
                  style={{ minHeight: '300px', maxHeight: '500px' }}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                  Position passport MRZ in view
                </div>
              </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Processing indicator */}
            {processing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Processing with Tesseract OCR... {ocrProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                Scan Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                <p className="font-medium">{result.message}</p>
                {result.hint && <p className="text-sm mt-1">{result.hint}</p>}
              </div>

              {parsedData && parsedData.fields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Passport Number</h4>
                    <p className="text-lg font-mono">{parsedData.fields.documentNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Nationality</h4>
                    <p className="text-lg">{parsedData.fields.nationality || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Surname</h4>
                    <p className="text-lg">{parsedData.fields.lastName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Given Names</h4>
                    <p className="text-lg">{parsedData.fields.firstName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Date of Birth</h4>
                    <p className="text-lg">{parsedData.fields.birthDate || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Sex</h4>
                    <p className="text-lg">{parsedData.fields.sex || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Expiry Date</h4>
                    <p className="text-lg">{parsedData.fields.expirationDate || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-600">Valid</h4>
                    <p className="text-lg">
                      {parsedData.valid ? (
                        <span className="text-green-600 font-semibold">✓ Valid</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✗ Invalid</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-yellow-900">Validation Errors:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>{err.field}: {err.error || 'Invalid'}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Raw OCR Output */}
        {rawOCR && (
          <Card>
            <CardHeader>
              <CardTitle>Raw OCR Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {rawOCR}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scanHistory.map((scan, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${scan.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {scan.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">
                          {scan.fields?.documentNumber || 'Failed scan'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {scan.source} • {scan.processingTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">How to Test:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Start Camera" or "Upload Image"</li>
              <li>Position passport MRZ (bottom 2 lines) clearly in view</li>
              <li>Capture or upload the image</li>
              <li>Wait for Tesseract OCR processing (2-5 seconds)</li>
              <li>Review parsed data and accuracy</li>
            </ol>
            <p className="text-sm text-blue-700 mt-3">
              <strong>Note:</strong> This is a free open source alternative. Expect lower accuracy (~70-85%)
              and slower processing compared to Dynamsoft (~95%, &lt;1s).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TesseractScannerTest;
