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
  const [selectedProfile, setSelectedProfile] = useState('prehkeytec'); // Default to PrehKeyTec
  const [customConfig, setCustomConfig] = useState(getScannerConfig('prehkeytec'));
  const [showRawData, setShowRawData] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState({});
  const [configName, setConfigName] = useState('');
  const [lastScanData, setLastScanData] = useState(null);
  const [scannerDetected, setScannerDetected] = useState(false);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState(null);

  // Track configuration changes for debugging
  React.useEffect(() => {
    if (customConfig.debugMode) {
      console.log('\n%c⚙️  CONFIG UPDATED', 'color: #8b5cf6; font-weight: bold');
      console.log('Scan Timeout:', customConfig.scanTimeout, 'ms');
      console.log('Min Length:', customConfig.minLength);
      console.log('Prefix Chars:', customConfig.prefixChars || '(none)');
      console.log('Suffix Chars:', customConfig.suffixChars || '(none)');
      console.log('Auto Submit:', customConfig.autoSubmit);
      console.log('Enter Key Submits:', customConfig.enterKeySubmits);
      console.log('MRZ Parsing:', customConfig.enableMrzParsing);
      console.log('Beep on Success:', customConfig.enableBeep);
      console.log('═══════════════════════════════════════════════════════\n');
    }
  }, [customConfig]);

  // Monitor keyboard activity to detect scanner
  React.useEffect(() => {
    let keystrokeCount = 0;
    let fastKeystrokeTimer = null;

    const handleKeyDown = (e) => {
      const now = Date.now();
      setLastKeystrokeTime(now);

      keystrokeCount++;

      // Clear previous timer
      clearTimeout(fastKeystrokeTimer);

      // If we get multiple keystrokes quickly, likely a scanner
      if (keystrokeCount >= 5) {
        setScannerDetected(true);
        console.log('🔍 Scanner activity detected!');
      }

      // Reset counter after 200ms of no activity
      fastKeystrokeTimer = setTimeout(() => {
        keystrokeCount = 0;
      }, 200);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(fastKeystrokeTimer);
    };
  }, []);

  // Load saved configs from localStorage on mount
  React.useEffect(() => {
    console.log('%c🔧 Scanner Test Page Initialized', 'color: #10b981; font-weight: bold; font-size: 14px');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📅 Session started:', new Date().toLocaleString());
    console.log('🎯 Default profile:', selectedProfile);
    console.log('⚙️  Initial config:', customConfig);
    console.log('═══════════════════════════════════════════════════════');

    const saved = localStorage.getItem('scanner_saved_configs');
    if (saved) {
      try {
        const configs = JSON.parse(saved);
        setSavedConfigs(configs);
        console.log('💾 Loaded saved configurations:', Object.keys(configs));
      } catch (e) {
        console.error('❌ Failed to load saved configs:', e);
      }
    } else {
      console.log('💾 No saved configurations found');
    }
  }, []);

  // Handle scan completion
  const handleScanComplete = (data) => {
    const timestamp = new Date();
    const scanEntry = {
      id: Date.now(),
      timestamp: timestamp.toISOString(),
      ...data
    };

    // Detailed console logging
    console.log('\n%c✅ SCAN COMPLETED', 'color: #10b981; font-weight: bold; font-size: 16px; background: #d1fae5; padding: 4px 8px');
    console.log('⏰ Time:', timestamp.toLocaleTimeString());
    console.log('📊 Scan Type:', data.type === 'mrz' ? 'MRZ Passport' : data.type === 'manual' ? 'Manual Entry' : 'Simple Barcode/QR');
    console.log('📏 Data Length:', data.length, 'characters');
    console.log('⚡ Scan Speed:', data.charsPerSecond || 'N/A', 'chars/sec');
    console.log('⏱️  Duration:', data.scanDuration || 'N/A', 'ms');

    if (data.type === 'mrz') {
      console.log('\n%c📘 PASSPORT DATA EXTRACTED', 'color: #3b82f6; font-weight: bold');
      console.table({
        'Passport Number': data.passportNumber,
        'Surname': data.surname,
        'Given Name': data.givenName,
        'Nationality': data.nationality,
        'Date of Birth': data.dob,
        'Sex': data.sex,
        'Expiry Date': data.dateOfExpiry
      });
    } else {
      console.log('📝 Value:', data.value);
    }

    if (data.raw) {
      console.log('\n%c🔍 RAW DATA', 'color: #64748b; font-weight: bold');
      console.log('Raw:', data.raw);
      console.log('Cleaned:', data.value);
      if (data.raw !== data.value) {
        console.log('🧹 Cleaning applied: removed', (data.raw.length - data.value.length), 'characters');
      }
    }

    console.log('\n%c⚙️  SCAN CONFIGURATION USED', 'color: #8b5cf6; font-weight: bold');
    console.log('Profile:', selectedProfile);
    console.log('Timeout:', customConfig.scanTimeout, 'ms');
    console.log('Min Length:', customConfig.minLength);
    console.log('Enter Key Submits:', customConfig.enterKeySubmits);
    console.log('Auto Submit:', customConfig.autoSubmit);
    console.log('MRZ Parsing:', customConfig.enableMrzParsing);
    console.log('═══════════════════════════════════════════════════════\n');

    setLastScanData(data); // Store for field preview
    setScanHistory(prev => [scanEntry, ...prev].slice(0, 20)); // Keep last 20 scans
  };

  // Handle scan error
  const handleScanError = (error) => {
    console.log('\n%c❌ SCAN ERROR', 'color: #ef4444; font-weight: bold; font-size: 16px; background: #fee2e2; padding: 4px 8px');
    console.log('⏰ Time:', new Date().toLocaleTimeString());
    console.log('❗ Error Type:', error.type || 'Unknown');
    console.log('📝 Message:', error.message || error);

    if (error.raw) {
      console.log('\n%c🔍 RAW DATA (Failed)', 'color: #dc2626; font-weight: bold');
      console.log('Raw input:', error.raw);
      console.log('Length:', error.raw.length);
    }

    console.log('\n%c💡 TROUBLESHOOTING SUGGESTIONS', 'color: #f59e0b; font-weight: bold');

    if (error.message && error.message.includes('MRZ')) {
      console.log('• Check that MRZ is exactly 88 characters (2 lines × 44)');
      console.log('• Verify passport is clean and readable');
      console.log('• Try scanning slower or from different angle');
      console.log('• Enable "Show Raw Scan Data" to inspect input');
    } else if (error.raw && error.raw.length < customConfig.minLength) {
      console.log('• Scan too short:', error.raw.length, 'chars (minimum:', customConfig.minLength + ')');
      console.log('• DECREASE "Minimum Length" setting if this is expected');
    } else {
      console.log('• Enable Debug Mode to see detailed scan process');
      console.log('• Check scanner configuration (timeout, prefix/suffix)');
      console.log('• Verify scanner is properly connected');
    }

    console.log('\n%c⚙️  CURRENT CONFIGURATION', 'color: #8b5cf6; font-weight: bold');
    console.log('Profile:', selectedProfile);
    console.log('Timeout:', customConfig.scanTimeout, 'ms');
    console.log('Min Length:', customConfig.minLength);
    console.log('MRZ Parsing:', customConfig.enableMrzParsing);
    console.log('Debug Mode:', customConfig.debugMode);
    console.log('═══════════════════════════════════════════════════════\n');
  };

  // Clear history
  const clearHistory = () => {
    setScanHistory([]);
    setLastScanData(null);
  };

  // Update scanner profile
  const handleProfileChange = (profile) => {
    console.log('\n%c🔄 PROFILE CHANGED', 'color: #3b82f6; font-weight: bold; font-size: 14px');
    console.log('Old profile:', selectedProfile);
    console.log('New profile:', profile);

    const newConfig = getScannerConfig(profile);
    console.log('New configuration:', newConfig);
    console.log('═══════════════════════════════════════════════════════\n');

    setSelectedProfile(profile);
    setCustomConfig(newConfig);
  };

  // Save current configuration
  const saveConfig = () => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    const newConfigs = {
      ...savedConfigs,
      [configName]: {
        ...customConfig,
        savedAt: new Date().toISOString()
      }
    };

    setSavedConfigs(newConfigs);
    localStorage.setItem('scanner_saved_configs', JSON.stringify(newConfigs));

    console.log('\n%c💾 CONFIGURATION SAVED', 'color: #10b981; font-weight: bold; font-size: 14px');
    console.log('Name:', configName);
    console.log('Config:', customConfig);
    console.log('Saved at:', new Date().toLocaleString());
    console.log('Total saved configs:', Object.keys(newConfigs).length);
    console.log('═══════════════════════════════════════════════════════\n');

    alert(`Configuration "${configName}" saved successfully!`);
    setConfigName('');
  };

  // Load saved configuration
  const loadConfig = (name) => {
    if (savedConfigs[name]) {
      console.log('\n%c📂 CONFIGURATION LOADED', 'color: #3b82f6; font-weight: bold; font-size: 14px');
      console.log('Name:', name);
      console.log('Config:', savedConfigs[name]);
      console.log('Saved at:', savedConfigs[name].savedAt ? new Date(savedConfigs[name].savedAt).toLocaleString() : 'Unknown');
      console.log('═══════════════════════════════════════════════════════\n');

      setCustomConfig(savedConfigs[name]);
      setSelectedProfile('custom');
      alert(`Configuration "${name}" loaded`);
    }
  };

  // Delete saved configuration
  const deleteConfig = (name) => {
    if (confirm(`Delete configuration "${name}"?`)) {
      const newConfigs = { ...savedConfigs };
      delete newConfigs[name];
      setSavedConfigs(newConfigs);
      localStorage.setItem('scanner_saved_configs', JSON.stringify(newConfigs));
    }
  };

  // Export configuration as JSON
  const exportConfig = () => {
    const configJson = JSON.stringify(customConfig, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanner-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

      {/* Scanner Detection Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={scannerDetected ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {scannerDetected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-lg font-semibold text-green-900">🟢 Scanner Detected</span>
                    </div>
                    <span className="text-sm text-green-700">
                      Fast keystroke activity detected - scanner appears to be working
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-lg font-semibold text-yellow-900">⚠️ No Scanner Detected</span>
                    </div>
                    <span className="text-sm text-yellow-700">
                      No fast keystroke activity - scanner may not be configured or connected
                    </span>
                  </>
                )}
              </div>
              {lastKeystrokeTime && (
                <span className="text-xs text-slate-500">
                  Last activity: {new Date(lastKeystrokeTime).toLocaleTimeString()}
                </span>
              )}
            </div>
            {!scannerDetected && (
              <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                <p className="text-sm text-yellow-900 font-semibold mb-2">⚡ Quick Test:</p>
                <ul className="text-xs text-yellow-800 space-y-1 ml-4">
                  <li>• Try scanning a passport - if status changes to green, scanner is working</li>
                  <li>• Or type very fast (5+ keys quickly) to test detection</li>
                  <li>• If status stays yellow after scanning, scanner needs configuration</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Scanner Configuration
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

          {/* Advanced Configuration for PrehKeyTec */}
          {selectedProfile === 'prehkeytec' && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-sm mb-4 text-emerald-700">🎯 PrehKeyTec MC147 A S - Advanced Tweaks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Inter-Character Delay (ms)</Label>
                  <Input
                    type="number"
                    value={customConfig.scanTimeout}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      scanTimeout: parseInt(e.target.value) || 60
                    }))}
                    min="20"
                    max="200"
                    step="10"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Typical: 30-60ms | Adjust if scans are missed or partial
                  </p>
                </div>

                <div>
                  <Label className="text-xs">Prefix Characters to Strip</Label>
                  <Input
                    type="text"
                    value={customConfig.prefixChars || ''}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      prefixChars: e.target.value
                    }))}
                    placeholder="e.g., ]C1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty if scanner doesn't add prefix
                  </p>
                </div>

                <div>
                  <Label className="text-xs">Suffix Characters to Strip</Label>
                  <Input
                    type="text"
                    value={customConfig.suffixChars || ''}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      suffixChars: e.target.value
                    }))}
                    placeholder="e.g., CR LF"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty if scanner doesn't add suffix
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Auto-Submit on Scan</Label>
                  <Switch
                    checked={customConfig.autoSubmit}
                    onCheckedChange={(checked) => setCustomConfig(prev => ({
                      ...prev,
                      autoSubmit: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Beep on Success</Label>
                  <Switch
                    checked={customConfig.enableBeep}
                    onCheckedChange={(checked) => setCustomConfig(prev => ({
                      ...prev,
                      enableBeep: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Enter Key Submits</Label>
                  <Switch
                    checked={customConfig.enterKeySubmits}
                    onCheckedChange={(checked) => setCustomConfig(prev => ({
                      ...prev,
                      enterKeySubmits: checked
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save/Load Configuration */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-sm mb-4">💾 Save / Load Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Configuration Name</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Optimal MC147 Settings"
                  />
                  <Button onClick={saveConfig} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Saved Configurations</Label>
                <div className="flex gap-2">
                  <Select value="" onValueChange={loadConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Load saved config..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(savedConfigs).length === 0 ? (
                        <SelectItem value="none" disabled>No saved configs</SelectItem>
                      ) : (
                        Object.keys(savedConfigs).map(name => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={exportConfig} variant="outline" size="sm">
                    Export JSON
                  </Button>
                </div>
                {Object.keys(savedConfigs).length > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    {Object.keys(savedConfigs).slice(0, 3).map(name => (
                      <div key={name} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-slate-700">{name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConfig(name)}
                          className="h-6 text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Population Preview */}
      {lastScanData && lastScanData.type === 'mrz' && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              ✓ Field Population Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-800 mb-4">
              This is how the scanned data would populate in the Individual Purchase form:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg">
              <div>
                <Label className="text-xs text-slate-600">Passport Number</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.passportNumber}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Surname</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.surname}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Given Name</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.givenName}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Nationality</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.nationality}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Date of Birth</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.dob}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Sex</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.sex}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Expiry Date</Label>
                <div className="bg-slate-50 p-2 rounded border font-medium">{lastScanData.dateOfExpiry}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Scan Speed</Label>
                <div className="bg-emerald-100 p-2 rounded border font-medium text-emerald-800">
                  {lastScanData.charsPerSecond} chars/sec
                </div>
              </div>
            </div>
            <p className="text-xs text-emerald-700 mt-3">
              ✓ All fields populated successfully - scanner is working correctly!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Test Scanner Input
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
              📄 Scan History
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
                        <span className="text-xl text-green-600">✓</span>
                      ) : (
                        <span className="text-xl text-blue-600">#</span>
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
                      <span className="text-slate-500">#</span>
                      Length: {scan.length} chars
                    </div>
                    {scan.scanDuration && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">⏱️</span>
                        Duration: {scan.scanDuration}ms
                      </div>
                    )}
                    {scan.charsPerSecond && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">⚡</span>
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
