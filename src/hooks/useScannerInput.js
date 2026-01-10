/**
 * useScannerInput - Keyboard Wedge Scanner Hook
 *
 * Captures input from USB scanners operating in HID keyboard mode.
 * Detects rapid keystroke patterns (scanner) vs normal typing (human).
 *
 * Works with:
 * - PrehKeyTec MC147 in keyboard mode
 * - Any barcode/MRZ scanner in keyboard wedge mode
 * - No drivers, COM ports, or services needed
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_OPTIONS = {
  minLength: 20,
  maxDelay: 100,
  endKeys: ['Enter'],
  enableMrzParsing: true,
};

function parseMrz(mrzRaw) {
  let mrz = mrzRaw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\r?\n/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (mrz.length < 88) {
    console.warn('[ScannerInput] MRZ too short:', mrz.length);
    return null;
  }

  mrz = mrz.substring(0, 88);
  const line1 = mrz.substring(0, 44);
  const line2 = mrz.substring(44, 88);

  try {
    const docType = line1.substring(0, 2);
    const issuingCountry = line1.substring(2, 5);
    const namesSection = line1.substring(5);
    const namesParts = namesSection.split('<<');
    const surname = (namesParts[0] || '').replace(/</g, ' ').trim();
    const givenName = (namesParts.slice(1).join(' ') || '').replace(/</g, ' ').trim();

    const passportNo = line2.substring(0, 9).replace(/</g, '').trim();
    const nationality = line2.substring(10, 13);
    const dobRaw = line2.substring(13, 19);
    const sex = line2.substring(20, 21);
    const expiryRaw = line2.substring(21, 27);

    const currentYear = new Date().getFullYear() % 100;
    const dobYear = parseInt(dobRaw.substring(0, 2));
    const dobFullYear = dobYear > currentYear ? 1900 + dobYear : 2000 + dobYear;
    const dob = dobFullYear + '-' + dobRaw.substring(2, 4) + '-' + dobRaw.substring(4, 6);

    const expiryYear = parseInt(expiryRaw.substring(0, 2));
    const expiryFullYear = expiryYear > 50 ? 1900 + expiryYear : 2000 + expiryYear;
    const dateOfExpiry = expiryFullYear + '-' + expiryRaw.substring(2, 4) + '-' + expiryRaw.substring(4, 6);

    const sexMap = { 'M': 'Male', 'F': 'Female', '<': 'Other' };

    return {
      type: docType,
      passport_no: passportNo,
      surname: surname,
      given_name: givenName,
      nationality: nationality,
      dob: dob,
      sex: sexMap[sex] || sex,
      date_of_expiry: dateOfExpiry,
      issuing_country: issuingCountry,
      raw_mrz: mrz,
    };
  } catch (error) {
    console.error('[ScannerInput] MRZ parsing error:', error);
    return null;
  }
}

export function useScannerInput(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [rawData, setRawData] = useState('');
  const [charCount, setCharCount] = useState(0);

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  const processBuffer = useCallback(() => {
    const data = bufferRef.current.trim();
    bufferRef.current = '';
    setIsScanning(false);
    setCharCount(0);

    if (data.length < config.minLength) {
      console.log('[ScannerInput] Ignored short input:', data.length);
      return;
    }

    console.log('[ScannerInput] Processing scan:', data.length, 'chars');
    console.log('[ScannerInput] Raw data:', data);
    setRawData(data);

    if (config.enableMrzParsing && data.length >= 88) {
      const parsed = parseMrz(data);
      if (parsed) {
        console.log('[ScannerInput] Parsed MRZ:', parsed);
        setLastScan(parsed);
        if (config.onScan) config.onScan(parsed);
        return;
      }
    }

    const result = { raw: data, type: 'unknown' };
    setLastScan(result);
    if (config.onScan) config.onScan(result);
  }, [config]);

  const handleKeyDown = useCallback((event) => {
    // Allow normal input in form fields
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );

    // Allow Ctrl/Cmd key combinations (paste, copy, etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // If typing in an input field, don't capture
    if (isInputField) {
      return;
    }

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (config.endKeys.includes(event.key)) {
      if (bufferRef.current.length > 0) {
        event.preventDefault();
        clearTimeout(timeoutRef.current);
        processBuffer();
      }
      return;
    }

    if (event.key.length !== 1) return;

    const isRapidInput = timeSinceLastKey < config.maxDelay || bufferRef.current.length === 0;

    if (isRapidInput) {
      if (bufferRef.current.length > 5) event.preventDefault();
      bufferRef.current += event.key;
      setCharCount(bufferRef.current.length);
      setIsScanning(true);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length >= config.minLength) {
          processBuffer();
        } else {
          bufferRef.current = '';
          setIsScanning(false);
          setCharCount(0);
        }
      }, config.maxDelay * 3);
    } else {
      bufferRef.current = event.key;
      setCharCount(1);
    }
  }, [config, processBuffer]);

  const startListening = useCallback(() => {
    if (isListening) return;
    console.log('[ScannerInput] Starting keyboard listener...');
    document.addEventListener('keydown', handleKeyDown, true);
    setIsListening(true);
  }, [isListening, handleKeyDown]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    console.log('[ScannerInput] Stopping keyboard listener...');
    document.removeEventListener('keydown', handleKeyDown, true);
    clearTimeout(timeoutRef.current);
    bufferRef.current = '';
    setIsListening(false);
    setIsScanning(false);
    setCharCount(0);
  }, [isListening, handleKeyDown]);

  const clearScan = useCallback(() => {
    setLastScan(null);
    setRawData('');
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);

  return {
    isListening,
    isScanning,
    lastScan,
    rawData,
    charCount,
    startListening,
    stopListening,
    clearScan,
  };
}

export default useScannerInput;
