/**
 * useScannerInput Hook
 *
 * Custom React hook for handling USB keyboard wedge scanners (passport MRZ, barcode, QR code).
 * Detects rapid keyboard input typical of hardware scanners and differentiates from human typing.
 *
 * How it works:
 * - Listens for rapid keystrokes (scanners type very fast, typically 50-100ms between chars)
 * - Accumulates characters until timeout or Enter key
 * - Automatically detects and parses MRZ format
 * - Provides callbacks for successful scans
 *
 * @example
 * const { isScanning, scannerValue, clearScanner } = useScannerInput({
 *   onScanComplete: (data) => console.log('Scanned:', data),
 *   minLength: 5,
 *   scanTimeout: 100,
 *   enableMrzParsing: true
 * });
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseMrz, isMrzFormat } from '@/lib/mrzParser';

/**
 * Default configuration for scanner input
 */
const DEFAULT_CONFIG = {
  minLength: 5,              // Minimum characters to consider a valid scan
  scanTimeout: 100,          // Max milliseconds between keystrokes (scanners are fast)
  enableMrzParsing: true,    // Auto-parse MRZ format
  autoSubmit: true,          // Auto-submit on scan complete
  preventManualInput: false, // If true, only accept scanner input (very fast typing)
  debugMode: false,          // Log debug information
  enterKeySubmits: true,     // Treat Enter key as scan completion
  prefixChars: '',           // Optional prefix characters to strip
  suffixChars: '',           // Optional suffix characters to strip
};

/**
 * useScannerInput Hook
 * @param {Object} options - Configuration options
 * @param {Function} options.onScanComplete - Callback when scan completes successfully
 * @param {Function} options.onScanError - Callback when scan fails
 * @param {number} options.minLength - Minimum characters for valid scan
 * @param {number} options.scanTimeout - Timeout between keystrokes (ms)
 * @param {boolean} options.enableMrzParsing - Enable automatic MRZ parsing
 * @param {boolean} options.autoSubmit - Auto-submit on scan complete
 * @param {boolean} options.preventManualInput - Only accept very fast input
 * @param {boolean} options.debugMode - Enable debug logging
 * @param {boolean} options.enterKeySubmits - Enter key completes scan
 * @param {string} options.prefixChars - Characters to strip from beginning
 * @param {string} options.suffixChars - Characters to strip from end
 * @returns {Object} Scanner state and methods
 */
export const useScannerInput = (options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };

  // State
  const [scannerValue, setScannerValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanData, setLastScanData] = useState(null);

  // Refs for tracking scan state
  const scanBuffer = useRef('');
  const scanTimeout = useRef(null);
  const firstKeystrokeTime = useRef(null);
  const lastKeystrokeTime = useRef(null);
  const keystrokeCount = useRef(0);
  const isProcessing = useRef(false);

  /**
   * Clean scanned data (remove prefix/suffix)
   */
  const cleanScannedData = useCallback((data) => {
    let cleaned = data;

    if (config.prefixChars && cleaned.startsWith(config.prefixChars)) {
      cleaned = cleaned.substring(config.prefixChars.length);
    }

    if (config.suffixChars && cleaned.endsWith(config.suffixChars)) {
      cleaned = cleaned.substring(0, cleaned.length - config.suffixChars.length);
    }

    return cleaned.trim();
  }, [config.prefixChars, config.suffixChars]);

  /**
   * Process completed scan
   */
  const processScan = useCallback((rawValue) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const cleanedValue = cleanScannedData(rawValue);

    if (cleanedValue.length < config.minLength) {
      if (config.debugMode) {
        console.log('[Scanner] Scan too short, ignoring:', cleanedValue.length, 'chars');
      }
      isProcessing.current = false;
      return;
    }

    // Calculate scan speed (chars per second)
    const scanDuration = lastKeystrokeTime.current - firstKeystrokeTime.current;
    const charsPerSecond = keystrokeCount.current / (scanDuration / 1000);

    if (config.debugMode) {
      console.log('[Scanner] Scan complete:', {
        value: cleanedValue,
        length: cleanedValue.length,
        duration: scanDuration + 'ms',
        speed: Math.round(charsPerSecond) + ' chars/sec',
        keystrokes: keystrokeCount.current
      });
    }

    let scanData = {
      type: 'simple',
      value: cleanedValue,
      raw: rawValue,
      length: cleanedValue.length,
      scanDuration,
      charsPerSecond: Math.round(charsPerSecond)
    };

    // Try MRZ parsing if enabled
    if (config.enableMrzParsing && isMrzFormat(cleanedValue)) {
      const mrzResult = parseMrz(cleanedValue);

      if (mrzResult.success) {
        scanData = {
          ...scanData,
          type: 'mrz',
          ...mrzResult
        };

        if (config.debugMode) {
          console.log('[Scanner] MRZ parsed successfully:', mrzResult);
        }
      } else {
        if (config.debugMode) {
          console.warn('[Scanner] MRZ parsing failed:', mrzResult.message);
        }

        if (config.onScanError) {
          config.onScanError(mrzResult);
        }
      }
    }

    // Update state
    setScannerValue(cleanedValue);
    setLastScanData(scanData);
    setIsScanning(false);

    // Trigger callback
    if (config.onScanComplete) {
      config.onScanComplete(scanData);
    }

    isProcessing.current = false;
  }, [cleanScannedData, config]);

  /**
   * Handle keystroke from scanner or keyboard
   */
  const handleKeystroke = useCallback((event) => {
    const now = Date.now();
    const char = event.key;

    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape'].includes(char)) {
      return;
    }

    // Handle Enter key
    if (char === 'Enter') {
      if (config.enterKeySubmits && scanBuffer.current.length > 0) {
        event.preventDefault();
        processScan(scanBuffer.current);
        scanBuffer.current = '';
        keystrokeCount.current = 0;
        firstKeystrokeTime.current = null;
        lastKeystrokeTime.current = null;
        clearTimeout(scanTimeout.current);
      }
      return;
    }

    // Track timing
    if (!firstKeystrokeTime.current) {
      firstKeystrokeTime.current = now;
      setIsScanning(true);
    }

    const timeSinceLastKey = lastKeystrokeTime.current ? now - lastKeystrokeTime.current : 0;
    lastKeystrokeTime.current = now;
    keystrokeCount.current++;

    // If preventManualInput is enabled, reject slow typing
    if (config.preventManualInput && timeSinceLastKey > config.scanTimeout && scanBuffer.current.length > 0) {
      if (config.debugMode) {
        console.log('[Scanner] Manual typing detected (too slow), resetting buffer');
      }
      scanBuffer.current = '';
      keystrokeCount.current = 1;
      firstKeystrokeTime.current = now;
    }

    // Add character to buffer (handle special keys)
    if (char.length === 1) {
      scanBuffer.current += char;
    } else if (char === 'Backspace') {
      scanBuffer.current = scanBuffer.current.slice(0, -1);
    }

    // Reset timeout
    clearTimeout(scanTimeout.current);

    // Set new timeout to process scan
    scanTimeout.current = setTimeout(() => {
      if (scanBuffer.current.length >= config.minLength) {
        processScan(scanBuffer.current);
      } else if (config.debugMode) {
        console.log('[Scanner] Buffer cleared (timeout):', scanBuffer.current);
      }

      scanBuffer.current = '';
      keystrokeCount.current = 0;
      firstKeystrokeTime.current = null;
      lastKeystrokeTime.current = null;
      setIsScanning(false);
    }, config.scanTimeout);

  }, [config, processScan]);

  /**
   * Clear scanner state
   */
  const clearScanner = useCallback(() => {
    scanBuffer.current = '';
    keystrokeCount.current = 0;
    firstKeystrokeTime.current = null;
    lastKeystrokeTime.current = null;
    setScannerValue('');
    setIsScanning(false);
    setLastScanData(null);
    clearTimeout(scanTimeout.current);
    isProcessing.current = false;

    if (config.debugMode) {
      console.log('[Scanner] State cleared');
    }
  }, [config.debugMode]);

  /**
   * Setup keyboard event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeystroke);

    return () => {
      window.removeEventListener('keydown', handleKeystroke);
      clearTimeout(scanTimeout.current);
    };
  }, [handleKeystroke]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearTimeout(scanTimeout.current);
    };
  }, []);

  return {
    scannerValue,      // Current scanned value
    isScanning,        // True when actively scanning
    lastScanData,      // Last scan result with metadata
    clearScanner,      // Function to clear scanner state
    // Utility methods
    isMrzFormat: (value) => isMrzFormat(value),
    parseMrz: (value) => parseMrz(value),
  };
};

export default useScannerInput;
