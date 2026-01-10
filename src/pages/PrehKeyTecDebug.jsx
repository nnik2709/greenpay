/**
 * PrehKeyTec Scanner Debug & Test Page
 *
 * Production-ready passport scanner interface for check-in counter agents.
 * Supports high-volume scanning (1000+ passports/day).
 *
 * Features:
 * - Auto-connect to scanner on page load (after first authorization)
 * - Auto-reconnect on USB disconnect/reconnect
 * - Session scan counter
 * - Clear status indicators
 * - Form auto-population from MRZ data
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSerial, ConnectionState } from '@/hooks/useWebSerial';
import { ScannerStatusFull } from '@/components/ScannerStatus';

const PrehKeyTecDebug = () => {
  const [scanHistory, setScanHistory] = useState([]);

  // Passport form fields
  const [passportForm, setPassportForm] = useState({
    passportNumber: '',
    surname: '',
    givenName: '',
    nationality: '',
    dob: '',
    sex: '',
    dateOfExpiry: '',
    issuingCountry: '',
  });

  // Handle scan data from scanner
  const handleScan = useCallback((data) => {
    console.log('[PrehKeyTec Debug] Scan received:', data);

    // Add to history
    const scanRecord = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    setScanHistory(prev => [scanRecord, ...prev].slice(0, 50));

    // Auto-populate form
    setPassportForm({
      passportNumber: data.passport_no || '',
      surname: data.surname || '',
      givenName: data.given_name || '',
      nationality: data.nationality || '',
      dob: data.dob || '',
      sex: data.sex || '',
      dateOfExpiry: data.date_of_expiry || '',
      issuingCountry: data.issuing_country || '',
    });
  }, []);

  // Web Serial hook with auto-connect enabled
  const scanner = useWebSerial({
    onScan: handleScan,
    autoConnect: true,
    autoReconnect: true,
  });

  // Clear form for next passport
  const clearForm = () => {
    setPassportForm({
      passportNumber: '',
      surname: '',
      givenName: '',
      nationality: '',
      dob: '',
      sex: '',
      dateOfExpiry: '',
      issuingCountry: '',
    });
    scanner.clearScan();
  };

  // Load from history
  const loadFromHistory = (scan) => {
    setPassportForm({
      passportNumber: scan.passport_no || '',
      surname: scan.surname || '',
      givenName: scan.given_name || '',
      nationality: scan.nationality || '',
      dob: scan.dob || '',
      sex: scan.sex || '',
      dateOfExpiry: scan.date_of_expiry || '',
      issuingCountry: scan.issuing_country || '',
    });
  };

  const hasFormData = passportForm.passportNumber !== '';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Passport Scanner
          </h1>
          <p className="text-slate-600">PrehKeyTec MC 147 A - Check-in Counter</p>
        </div>
        {scanner.isReady && (
          <div className="text-right">
            <div className="text-4xl font-bold text-green-600">{scanner.scanCount}</div>
            <div className="text-sm text-slate-500">passports scanned</div>
          </div>
        )}
      </div>

      {/* Scanner Status */}
      <ScannerStatusFull
        connectionState={scanner.connectionState}
        scanCount={scanner.scanCount}
        error={scanner.error}
        onConnect={scanner.connect}
        onDisconnect={scanner.disconnect}
        onReconnect={scanner.reconnect}
        isSupported={scanner.isSupported}
        reconnectAttempt={scanner.reconnectAttempt}
      />

      {/* First-time setup instructions */}
      {scanner.connectionState === ConnectionState.DISCONNECTED && !scanner.error && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>First-time setup:</strong> Click "Connect Scanner" above and select the PrehKeyTec COM port.
            After this one-time authorization, the scanner will auto-connect on future visits.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passport Form - Left Side */}
        <Card className={hasFormData ? 'border-green-500 ring-2 ring-green-200' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Passport Details</span>
              {hasFormData && (
                <Badge className="bg-green-500">Scanned</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {scanner.isReady
                ? 'Place passport on scanner - data will appear automatically'
                : 'Connect scanner to begin scanning passports'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passport Number */}
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={passportForm.passportNumber}
                onChange={(e) => setPassportForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                placeholder="e.g., AB1234567"
                className={hasFormData ? 'border-green-500 bg-green-50 font-medium' : ''}
              />
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="givenName">Given Name</Label>
                <Input
                  id="givenName"
                  value={passportForm.givenName}
                  onChange={(e) => setPassportForm(prev => ({ ...prev, givenName: e.target.value }))}
                  placeholder="First name"
                  className={hasFormData ? 'border-green-500 bg-green-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={passportForm.surname}
                  onChange={(e) => setPassportForm(prev => ({ ...prev, surname: e.target.value }))}
                  placeholder="Last name"
                  className={hasFormData ? 'border-green-500 bg-green-50' : ''}
                />
              </div>
            </div>

            {/* Nationality & Issuing Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={passportForm.nationality}
                  onChange={(e) => setPassportForm(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="e.g., PNG"
                  className={hasFormData ? 'border-green-500 bg-green-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuingCountry">Issuing Country</Label>
                <Input
                  id="issuingCountry"
                  value={passportForm.issuingCountry}
                  onChange={(e) => setPassportForm(prev => ({ ...prev, issuingCountry: e.target.value }))}
                  placeholder="e.g., PNG"
                  className={hasFormData ? 'border-green-500 bg-green-50' : ''}
                />
              </div>
            </div>

            {/* DOB & Sex */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="text"
                  value={passportForm.dob}
                  onChange={(e) => setPassportForm(prev => ({ ...prev, dob: e.target.value }))}
                  placeholder="YYYY-MM-DD"
                  className={hasFormData ? 'border-green-500 bg-green-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={passportForm.sex}
                  onValueChange={(value) => setPassportForm(prev => ({ ...prev, sex: value }))}
                >
                  <SelectTrigger className={hasFormData ? 'border-green-500 bg-green-50' : ''}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="dateOfExpiry">Date of Expiry</Label>
              <Input
                id="dateOfExpiry"
                type="text"
                value={passportForm.dateOfExpiry}
                onChange={(e) => setPassportForm(prev => ({ ...prev, dateOfExpiry: e.target.value }))}
                placeholder="YYYY-MM-DD"
                className={hasFormData ? 'border-green-500 bg-green-50' : ''}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={clearForm}
                variant="outline"
                className="flex-1"
                disabled={!hasFormData}
              >
                Clear / Next Passport
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!passportForm.passportNumber}
              >
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Status & History */}
        <div className="space-y-6">
          {/* Waiting for scan indicator */}
          {scanner.isReady && !hasFormData && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Ready to Scan</h3>
                <p className="text-amber-700">
                  Place a passport on the scanner
                </p>
              </CardContent>
            </Card>
          )}

          {/* Last scan success */}
          {scanner.lastScan && hasFormData && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Passport Scanned Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-700">Passport:</span>
                    <span className="ml-2 font-bold text-green-900">{scanner.lastScan.passport_no}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Name:</span>
                    <span className="ml-2 font-semibold">{scanner.lastScan.given_name} {scanner.lastScan.surname}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Nationality:</span>
                    <span className="ml-2 font-semibold">{scanner.lastScan.nationality}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Expiry:</span>
                    <span className="ml-2 font-semibold">{scanner.lastScan.date_of_expiry}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection info */}
          {scanner.portInfo && (
            <Card className="bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <div>USB Vendor: 0x{scanner.portInfo.usbVendorId?.toString(16).toUpperCase() || 'N/A'}</div>
                <div>USB Product: 0x{scanner.portInfo.usbProductId?.toString(16).toUpperCase() || 'N/A'}</div>
                <div>State: {scanner.connectionState}</div>
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex justify-between items-center">
                  <span>Recent Scans ({scanHistory.length})</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => scanner.resetScanCount()}
                    >
                      Reset Counter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanHistory([])}
                    >
                      Clear History
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scanHistory.map((scan, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => loadFromHistory(scan)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-900">{scan.passport_no}</div>
                          <div className="text-sm text-slate-600">
                            {scan.given_name} {scan.surname}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(scan.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help info */}
          <Card className="bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <div><strong>Green LED on keyboard:</strong> Scanner ready</div>
              <div><strong>Red LED:</strong> Scanner not connected - click Connect Scanner</div>
              <div><strong>After first connect:</strong> Scanner auto-connects on page load</div>
              <div><strong>If scanner disconnects:</strong> Will auto-reconnect within seconds</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrehKeyTecDebug;
