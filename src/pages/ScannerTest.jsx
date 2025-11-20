/**
 * Scanner Test Page
 *
 * Interactive testing page for hardware scanner integration.
 * Use this page to test your USB keyboard wedge scanners before deploying to production.
 *
 * Features:
 * - Test MRZ passport scanning
 * - Test simple barcode/QR scanning
 * - View scan speed and metadata
 * - Adjust scanner settings in real-time
 * - Debug logging
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, CheckCircle, XCircle, Clock, Zap, Hash, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ScannerInput from '@/components/ScannerInput';
import { useScannerInput } from '@/hooks/useScannerInput';
import { getScannerConfig, SCANNER_PROFILES } from '@/lib/scannerConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ScannerTest = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('generic');
  const [customConfig, setCustomConfig] = useState(getScannerConfig('generic'));
  const [showRawData, setShowRawData] = useState(false);

  // Handle scan completion
  const handleScanComplete = (data) => {
    const scanEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data
    };

    setScanHistory(prev => [scanEntry, ...prev].slice(0, 10)); // Keep last 10 scans
  };

  // Handle scan error
  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

  // Clear history
  const clearHistory = () => {
    setScanHistory([]);
  };

  // Update scanner profile
  const handleProfileChange = (profile) => {
    setSelectedProfile(profile);
    setCustomConfig(getScannerConfig(profile));
  };

  // Sample MRZ data for testing
  const sampleMrz = 'P<PNGDOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<AB1234567PNG9001011M2512319<<<<<<<<<<<<<<<06';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Scanner Hardware Test
        </h1>
        <p className="text-slate-600">Test your USB keyboard wedge scanners (Passport MRZ, Barcode, QR Code)</p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Scanner Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Selection */}
            <div>
              <Label>Scanner Profile</Label>
              <Select value={selectedProfile} onValueChange={handleProfileChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SCANNER_PROFILES).map(key => (
                    <SelectItem key={key} value={key}>
                      {SCANNER_PROFILES[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {SCANNER_PROFILES[selectedProfile]?.description}
              </p>
            </div>

            {/* Scan Timeout */}
            <div>
              <Label>Scan Timeout (ms)</Label>
              <Input
                type="number"
                value={customConfig.scanTimeout}
                onChange={(e) => setCustomConfig(prev => ({
                  ...prev,
                  scanTimeout: parseInt(e.target.value) || 100
                }))}
                min="10"
                max="1000"
              />
              <p className="text-xs text-slate-500 mt-1">
                Max time between keystrokes (lower = faster scanners)
              </p>
            </div>

            {/* Min Length */}
            <div>
              <Label>Minimum Length</Label>
              <Input
                type="number"
                value={customConfig.minLength}
                onChange={(e) => setCustomConfig(prev => ({
                  ...prev,
                  minLength: parseInt(e.target.value) || 5
                }))}
                min="1"
                max="100"
              />
            </div>

            {/* Debug Mode */}
            <div className="flex items-center justify-between">
              <Label>Debug Mode (Console Logging)</Label>
              <Switch
                checked={customConfig.debugMode}
                onCheckedChange={(checked) => setCustomConfig(prev => ({
                  ...prev,
                  debugMode: checked
                }))}
              />
            </div>

            {/* MRZ Parsing */}
            <div className="flex items-center justify-between">
              <Label>Enable MRZ Parsing</Label>
              <Switch
                checked={customConfig.enableMrzParsing}
                onCheckedChange={(checked) => setCustomConfig(prev => ({
                  ...prev,
                  enableMrzParsing: checked
                }))}
              />
            </div>

            {/* Show Raw Data */}
            <div className="flex items-center justify-between">
              <Label>Show Raw Scan Data</Label>
              <Switch
                checked={showRawData}
                onCheckedChange={setShowRawData}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Scanner Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Scan Passport MRZ or Barcode</Label>
            <ScannerInput
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
              placeholder="Position cursor here and scan with your device..."
              className="text-lg h-14"
              autoFocus={true}
              {...customConfig}
            />
            <p className="text-xs text-slate-500 mt-2">
              Click in the field above, then use your USB scanner to scan a passport MRZ or barcode.
              The system will automatically detect and process the scan.
            </p>
          </div>

          {/* Sample MRZ for manual testing */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <Label className="text-sm font-semibold mb-2 block">Sample MRZ for Manual Testing</Label>
            <p className="text-xs text-slate-600 mb-2">Copy and paste this into the field above to simulate a scan:</p>
            <code className="block bg-white p-2 rounded border text-xs font-mono break-all select-all">
              {sampleMrz}
            </code>
            <p className="text-xs text-slate-500 mt-2">
              This represents: John Doe, PNG passport AB1234567, DOB: 1990-01-01, Expiry: 2025-12-31
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scan History
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              Clear History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No scans yet. Use the scanner input above to test.</p>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-slate-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {scan.type === 'mrz' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Hash className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="font-semibold">
                        {scan.type === 'mrz' ? 'MRZ Passport Scan' : scan.type === 'manual' ? 'Manual Entry' : 'Simple Scan'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* MRZ Data */}
                  {scan.type === 'mrz' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Passport:</span>{' '}
                        <span className="font-medium">{scan.passportNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Name:</span>{' '}
                        <span className="font-medium">{scan.givenName} {scan.surname}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Nationality:</span>{' '}
                        <span className="font-medium">{scan.nationality}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">DOB:</span>{' '}
                        <span className="font-medium">{scan.dob}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Sex:</span>{' '}
                        <span className="font-medium">{scan.sex}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expiry:</span>{' '}
                        <span className="font-medium">{scan.dateOfExpiry}</span>
                      </div>
                    </div>
                  )}

                  {/* Simple Scan Data */}
                  {scan.type !== 'mrz' && (
                    <div className="mb-3">
                      <span className="text-slate-500 text-sm">Value:</span>{' '}
                      <span className="font-medium">{scan.value}</span>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 border-t pt-2">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Length: {scan.length} chars
                    </div>
                    {scan.scanDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {scan.scanDuration}ms
                      </div>
                    )}
                    {scan.charsPerSecond && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Speed: {scan.charsPerSecond} chars/sec
                      </div>
                    )}
                  </div>

                  {/* Raw Data (if enabled) */}
                  {showRawData && scan.raw && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-slate-500">Raw Data:</Label>
                      <code className="block bg-white p-2 rounded border text-xs font-mono break-all mt-1">
                        {scan.raw}
                      </code>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2 text-sm">
          <p><strong>1. Hardware Setup:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Connect your USB scanner (no drivers needed for keyboard wedge type)</li>
            <li>Wait for the device to be recognized</li>
            <li>Click in the "Test Scanner Input" field above</li>
          </ul>

          <p className="pt-2"><strong>2. Testing MRZ Passport Scanner:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Scan the MRZ zone at the bottom of a passport (2 lines of text)</li>
            <li>The system should auto-detect and parse the data</li>
            <li>Check the scan history below for parsed passport details</li>
          </ul>

          <p className="pt-2"><strong>3. Testing QR/Barcode Scanner:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Scan any QR code or barcode</li>
            <li>The system will capture the value automatically</li>
            <li>Check scan speed in the history (should be very fast)</li>
          </ul>

          <p className="pt-2"><strong>4. Manual Testing:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use the sample MRZ data provided above</li>
            <li>Copy and paste it quickly into the input field</li>
            <li>This simulates a fast scanner input</li>
          </ul>

          <p className="pt-2"><strong>5. Troubleshooting:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Enable "Debug Mode" to see console logs</li>
            <li>Adjust "Scan Timeout" if scans are not detected</li>
            <li>Try different scanner profiles (Professional, Budget, etc.)</li>
            <li>Check that cursor is in the input field before scanning</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScannerTest;
