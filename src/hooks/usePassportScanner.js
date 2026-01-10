/**
 * usePassportScanner Hook
 *
 * Polls the backend for passport scans from hardware scanners.
 * Works with passport_ocr_service.exe which POSTs MRZ data to the backend.
 *
 * This hook polls GET /api/ocr/passport-scan/status every few seconds
 * to check for new scans. When a scan is detected, the onScan callback is called.
 *
 * @example
 * const { isPolling, lastScan, error, startPolling, stopPolling } = usePassportScanner({
 *   onScan: (data) => {
 *     console.log('Passport scanned:', data.passport_no);
 *     setPassportNumber(data.passport_no);
 *     setGivenName(data.given_name);
 *     setSurname(data.surname);
 *   }
 * });
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds

/**
 * Hook for receiving passport scans from hardware scanner via backend polling
 *
 * @param {Object} options
 * @param {string} options.apiUrl - Backend API URL (default: from env or localhost:3001)
 * @param {number} options.pollInterval - Polling interval in ms (default: 2000)
 * @param {function} options.onScan - Callback when a new scan is received
 * @param {boolean} options.autoStart - Auto-start polling on mount (default: false)
 */
export const usePassportScanner = ({
  apiUrl = DEFAULT_API_URL,
  pollInterval = DEFAULT_POLL_INTERVAL,
  onScan,
  autoStart = false,
} = {}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(0);

  const intervalRef = useRef(null);
  const onScanRef = useRef(onScan);
  const mountedRef = useRef(true);

  // Keep callback ref updated
  useEffect(() => {
    onScanRef.current = onScan;
  });

  // Poll for new scans
  const poll = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/ocr/passport-scan/status?since=${lastTimestamp}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.hasNewData && data.data) {
        console.log('[PassportScanner] New scan received:', data.data.passport_no);

        setLastScan(data.data);
        setLastTimestamp(data.timestamp);
        setError(null);

        if (onScanRef.current) {
          onScanRef.current(data.data);
        }
      }
    } catch (err) {
      console.error('[PassportScanner] Poll error:', err.message);
      setError(err.message);
    }
  }, [apiUrl, lastTimestamp]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      return; // Already polling
    }

    console.log('[PassportScanner] Starting polling...');
    setIsPolling(true);
    setError(null);

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        poll();
      }
    }, pollInterval);
  }, [poll, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log('[PassportScanner] Stopping polling...');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Clear last scan
  const clearScan = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/ocr/passport-scan`, {
        method: 'DELETE',
      });
      setLastScan(null);
      setLastTimestamp(Date.now());
    } catch (err) {
      console.error('[PassportScanner] Clear error:', err);
    }
  }, [apiUrl]);

  // Auto-start on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoStart) {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [autoStart, startPolling, stopPolling]);

  return {
    // State
    isPolling,
    lastScan,
    error,

    // Actions
    startPolling,
    stopPolling,
    clearScan,
  };
};

export default usePassportScanner;
