import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const MrzScannerTest = () => {
  const [activeTab, setActiveTab] = useState('dynamsoft');
  const [dynamsoft, setDynamsoft] = useState({
    loaded: false,
    loading: false,
    error: null,
    result: null,
    processing: false
  });
  const [pixl, setPixl] = useState({
    loaded: false,
    loading: false,
    error: null,
    result: null,
    processing: false
  });

  const dynamsoftContainerRef = useRef(null);
  const pixlContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dynamsoft MRZ Scanner initialization
  const initializeDynamsoft = async () => {
    setDynamsoft(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load Dynamsoft MRZ Scanner SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@3.0.0/dist/mrz-scanner.bundle.js';
      script.async = true;

      script.onload = async () => {
        try {
          console.log('Dynamsoft SDK loaded');
          // Initialize with license (using public trial key)
          const licenseKey = 'DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==';

          console.log('Creating MRZ Scanner instance (without container)...');
          // Don't use container - let it create its own modal overlay
          const mrzScanner = new window.Dynamsoft.MRZScanner({
            license: licenseKey
          });

          console.log('MRZ Scanner created:', mrzScanner);

          setDynamsoft(prev => ({
            ...prev,
            loaded: true,
            loading: false,
            scanner: mrzScanner
          }));
        } catch (err) {
          console.error('Initialization error:', err);
          setDynamsoft(prev => ({
            ...prev,
            loading: false,
            error: `Initialization error: ${err.message}`
          }));
        }
      };

      script.onerror = () => {
        console.error('Failed to load SDK script');
        setDynamsoft(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load Dynamsoft SDK script'
        }));
      };

      document.head.appendChild(script);
    } catch (err) {
      console.error('Setup error:', err);
      setDynamsoft(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  // Dynamsoft: Launch camera scanner
  const launchDynamsoftScanner = async () => {
    if (!dynamsoft.scanner) {
      console.error('Dynamsoft scanner not initialized');
      return;
    }

    console.log('Launching Dynamsoft scanner...');
    setDynamsoft(prev => ({ ...prev, processing: true, result: null, error: null }));

    try {
      console.log('Calling scanner.launch()...');
      const result = await dynamsoft.scanner.launch();
      console.log('Scan result received:', result);
      console.log('Scan result type:', typeof result);
      console.log('Scan result is array?:', Array.isArray(result));

      // Log the entire object structure
      if (result) {
        try {
          console.log('Result stringified:', JSON.stringify(result, null, 2));
        } catch (e) {
          console.log('Cannot stringify, logging properties instead');
          for (let key in result) {
            console.log(`  ${key}:`, result[key]);
          }
        }
      }

      if (result) {
        setDynamsoft(prev => ({
          ...prev,
          processing: false,
          result: formatDynamsoftResult(result)
        }));
      } else {
        console.warn('Scan returned null/undefined');
        setDynamsoft(prev => ({
          ...prev,
          processing: false,
          error: 'Scan cancelled or returned no result'
        }));
      }
    } catch (err) {
      console.error('Scan error:', err);
      setDynamsoft(prev => ({
        ...prev,
        processing: false,
        error: `Scan error: ${err.message || 'Unknown error'}`
      }));
    }
  };

  // Helper function to format date objects to string
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    if (typeof dateObj === 'string') return dateObj;
    if (typeof dateObj === 'object' && dateObj.year && dateObj.month && dateObj.day) {
      // Format as YYYY-MM-DD
      const month = String(dateObj.month).padStart(2, '0');
      const day = String(dateObj.day).padStart(2, '0');
      return `${dateObj.year}-${month}-${day}`;
    }
    return 'N/A';
  };

  // Format Dynamsoft result for display
  const formatDynamsoftResult = (result) => {
    if (!result) {
      console.warn('No result to format');
      return null;
    }

    console.log('Raw Dynamsoft result:', result);
    console.log('Result keys:', Object.keys(result));
    console.log('Result type:', typeof result);

    // Dynamsoft puts the parsed MRZ data in result.data
    const data = result.data || result.result || result.parsedResultItems?.[0] || result;
    console.log('Extracted data:', data);
    console.log('Data keys:', data ? Object.keys(data) : 'none');

    // Try multiple field names for nationality as different versions use different names
    const nationality = data.nationality ||
                       data.nationalityCode ||
                       data.nationalityCountryCode ||
                       data.issuerCode ||
                       'N/A';

    const formatted = {
      documentType: data.documentType || data.type || 'Unknown',
      documentNumber: data.documentNumber || data.passportNumber || 'N/A',
      surname: data.surname || data.surName || data.lastName || 'N/A',
      givenNames: data.givenNames || data.givenName || data.firstName || 'N/A',
      nationality: nationality,
      dateOfBirth: formatDate(data.dateOfBirth || data.birthDate),
      sex: data.sex || data.gender || 'N/A',
      dateOfExpiry: formatDate(data.dateOfExpiry || data.expiryDate),
      issuingState: data.issuingState || data.issuingCountry || 'N/A',
      rawMRZ: data.rawMRZ || data.mrzText || data.text || result.text || 'N/A',
      confidence: data.confidence || result.confidence || 'N/A'
    };

    console.log('Formatted result:', formatted);
    return formatted;
  };

  // Initialize Pixl SDK (placeholder)
  const initializePixl = () => {
    setPixl(prev => ({
      ...prev,
      loading: false,
      error: 'Pixl SDK requires API key. Contact pixl.ai for access.'
    }));
  };

  // File upload handler for testing
  const handleFileUpload = async (event, sdk) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (sdk === 'dynamsoft' && dynamsoft.scanner) {
      setDynamsoft(prev => ({ ...prev, processing: true, result: null }));

      try {
        // Create image element for processing
        const img = new Image();
        const reader = new FileReader();

        reader.onload = async (e) => {
          img.src = e.target.result;
          img.onload = async () => {
            try {
              // Process image with Dynamsoft
              const result = await dynamsoft.scanner.recognize(img);
              setDynamsoft(prev => ({
                ...prev,
                processing: false,
                result: formatDynamsoftResult(result)
              }));
            } catch (err) {
              setDynamsoft(prev => ({
                ...prev,
                processing: false,
                error: `Processing error: ${err.message}`
              }));
            }
          };
        };

        reader.readAsDataURL(file);
      } catch (err) {
        setDynamsoft(prev => ({
          ...prev,
          processing: false,
          error: `File upload error: ${err.message}`
        }));
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MRZ Scanner SDK Testing</h1>
        <p className="text-muted-foreground">
          Test Dynamsoft MRZ Scanner for passport OCR scanning
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This is a testing page to evaluate MRZ scanning SDK. Results here do not affect the production /buy-online functionality.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dynamsoft">
            Dynamsoft MRZ Scanner
            {dynamsoft.loaded && <Badge variant="outline" className="ml-2">Ready</Badge>}
          </TabsTrigger>
          <TabsTrigger value="pixl">
            Pixl Passport SDK
            {pixl.loaded && <Badge variant="outline" className="ml-2">Ready</Badge>}
          </TabsTrigger>
          <TabsTrigger value="comparison">
            Comparison
          </TabsTrigger>
        </TabsList>

        {/* Dynamsoft Tab */}
        <TabsContent value="dynamsoft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamsoft MRZ Scanner</CardTitle>
              <CardDescription>
                Commercial SDK with 30-day free trial. Supports MRZ scanning from camera and image upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SDK Status */}
              <div className="flex items-center gap-4">
                {!dynamsoft.loaded && !dynamsoft.loading && (
                  <Button onClick={initializeDynamsoft}>
                    Initialize Dynamsoft SDK
                  </Button>
                )}

                {dynamsoft.loading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading SDK...</span>
                  </div>
                )}

                {dynamsoft.loaded && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>SDK Ready</span>
                  </div>
                )}

                {dynamsoft.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{dynamsoft.error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Scanner Container */}
              <div
                ref={dynamsoftContainerRef}
                className="border rounded-lg bg-gray-50 min-h-[400px] flex items-center justify-center"
              >
                {!dynamsoft.loaded && (
                  <p className="text-muted-foreground">Initialize SDK to start scanning</p>
                )}
              </div>

              {/* Action Buttons */}
              {dynamsoft.loaded && (
                <div className="flex gap-4">
                  <Button
                    onClick={launchDynamsoftScanner}
                    disabled={dynamsoft.processing}
                  >
                    {dynamsoft.processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Scan from Camera
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={dynamsoft.processing}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'dynamsoft')}
                  />
                </div>
              )}

              {/* Results Display */}
              {dynamsoft.result && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Scan Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                        <p className="text-base font-semibold">{dynamsoft.result.documentType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Document Number</p>
                        <p className="text-base font-semibold">{dynamsoft.result.documentNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Surname</p>
                        <p className="text-base font-semibold">{dynamsoft.result.surname}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Given Names</p>
                        <p className="text-base font-semibold">{dynamsoft.result.givenNames}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                        <p className="text-base font-semibold">{dynamsoft.result.nationality}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                        <p className="text-base font-semibold">{dynamsoft.result.dateOfBirth}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Sex</p>
                        <p className="text-base font-semibold">{dynamsoft.result.sex}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date of Expiry</p>
                        <p className="text-base font-semibold">{dynamsoft.result.dateOfExpiry}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Issuing State</p>
                        <p className="text-base font-semibold">{dynamsoft.result.issuingState}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                        <p className="text-base font-semibold">{dynamsoft.result.confidence}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Raw MRZ</p>
                      <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                        {dynamsoft.result.rawMRZ}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pixl Tab */}
        <TabsContent value="pixl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pixl Passport SDK</CardTitle>
              <CardDescription>
                Enterprise-grade passport OCR solution. Requires API key from pixl.ai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To test Pixl Passport SDK:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Visit <a href="https://pixl.ai/passport-ocr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">pixl.ai/passport-ocr</a></li>
                    <li>Request API access or book a demo</li>
                    <li>Obtain your API key and SDK credentials</li>
                    <li>Add credentials to environment variables</li>
                    <li>Integration code will be added here</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button onClick={initializePixl} variant="outline">
                  Check SDK Status
                </Button>
                <Button asChild variant="default">
                  <a href="https://pixl.ai/contact-us.html" target="_blank" rel="noopener noreferrer">
                    Request Pixl Access
                  </a>
                </Button>
              </div>

              {pixl.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pixl.error}</AlertDescription>
                </Alert>
              )}

              <div ref={pixlContainerRef} className="border rounded-lg bg-gray-50 min-h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Pixl SDK integration pending API access</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SDK Comparison</CardTitle>
              <CardDescription>
                Feature and performance comparison of MRZ scanning solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-left p-4 font-semibold">Current (html5-qrcode)</th>
                      <th className="text-left p-4 font-semibold">Dynamsoft MRZ</th>
                      <th className="text-left p-4 font-semibold">Pixl Passport</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">MRZ Recognition</td>
                      <td className="p-4">❌ No (manual entry)</td>
                      <td className="p-4">✅ Yes</td>
                      <td className="p-4">✅ Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Camera Support</td>
                      <td className="p-4">✅ Yes (QR only)</td>
                      <td className="p-4">✅ Yes</td>
                      <td className="p-4">✅ Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Image Upload</td>
                      <td className="p-4">❌ No</td>
                      <td className="p-4">✅ Yes</td>
                      <td className="p-4">✅ Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">PDF Support</td>
                      <td className="p-4">❌ No</td>
                      <td className="p-4">✅ Yes</td>
                      <td className="p-4">✅ Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Trial Access</td>
                      <td className="p-4">N/A</td>
                      <td className="p-4">✅ Immediate (30 days)</td>
                      <td className="p-4">📧 Contact required</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Pricing</td>
                      <td className="p-4">Free</td>
                      <td className="p-4">30-day trial, then paid</td>
                      <td className="p-4">Contact for pricing</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Integration Complexity</td>
                      <td className="p-4">Simple</td>
                      <td className="p-4">Medium</td>
                      <td className="p-4">Medium-High</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Documentation</td>
                      <td className="p-4">Good</td>
                      <td className="p-4">Excellent</td>
                      <td className="p-4">Contact required</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Accuracy (estimated)</td>
                      <td className="p-4">N/A (manual)</td>
                      <td className="p-4">High (95%+)</td>
                      <td className="p-4">Very High (98%+)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Recommendations</h3>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>For immediate testing:</strong> Start with Dynamsoft MRZ Scanner. It has excellent documentation,
                    30-day free trial, and can be integrated quickly for evaluation.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>For enterprise solution:</strong> Contact Pixl for API access and pricing. Their solution is
                    specifically designed for passport verification and may offer better accuracy and features.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <strong>Current solution:</strong> Works well for QR code scanning but requires manual passport entry.
                    Consider upgrading if passport volume increases significantly.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Testing Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Test Passport Images:</strong> Use sample passport images from public datasets or test documents</p>
          <p><strong>Camera Permissions:</strong> Browser will request camera access for live scanning</p>
          <p><strong>Performance:</strong> Test with different lighting conditions and image qualities</p>
          <p><strong>Accuracy:</strong> Compare extracted data with actual passport details</p>
          <p><strong>Integration:</strong> Once satisfied, can be integrated into /buy-online or other pages</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MrzScannerTest;
