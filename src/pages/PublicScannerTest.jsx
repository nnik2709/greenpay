import React, { useState } from 'react';
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, RefreshCw, Camera } from 'lucide-react';

const PublicScannerTest = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScanSuccess = (data) => {
    console.log('Scan Success:', data);
    setScanResult(data);
    setShowScanner(false);
    setError(null);
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  const resetTest = () => {
    setScanResult(null);
    setError(null);
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">MRZ Camera Scanner Test</h1>
          <p className="text-slate-600">Testing the improved Tesseract.js MRZ detection and parsing</p>
        </div>

        {!showScanner && !scanResult && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="bg-emerald-100 p-4 rounded-full">
                <Camera className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Ready to Test</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Click the button below to open the camera scanner and test the new MRZ parsing logic.
                </p>
              </div>
              <Button 
                onClick={() => setShowScanner(true)}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Start Camera Scanner
              </Button>
            </CardContent>
          </Card>
        )}

        {showScanner && (
          <Card>
            <CardContent className="p-4">
              <SimpleCameraScanner 
                onScanSuccess={handleScanSuccess}
                onClose={handleClose}
              />
            </CardContent>
          </Card>
        )}

        {scanResult && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Scan Successful
                </CardTitle>
                <CardDescription className="text-green-700">
                  MRZ data extracted and validated successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(scanResult).map(([key, value]) => (
                    <div key={key} className="bg-white p-3 rounded border border-green-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-lg font-medium text-slate-900">{value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button onClick={resetTest} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-100">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Another Passport
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">About this Scanner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-4">
            <div className="flex gap-3">
              <div className="bg-blue-100 p-2 rounded h-fit">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Improved OCR Logic</p>
                <p>We now use Otsu's Binarization and sharpening to help Tesseract.js see the MRZ characters more clearly.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-amber-100 p-2 rounded h-fit">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Smart Check Digits</p>
                <p>The parser now validates ICAO 9303 check digits and automatically fixes common OCR misreads (like O/0, I/1, S/5).</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicScannerTest;



