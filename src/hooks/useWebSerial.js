/**
 * useWebSerial - Production-Ready Web Serial Hook for Passport Scanning
 *
 * Designed for high-volume counter operations (1000+ scans/day).
 * Auto-connects, auto-reconnects, and maintains persistent connection.
 *
 * Features:
 * - Auto-connect to remembered port on page load
 * - Auto-reconnect on USB disconnect/reconnect
 * - Connection health monitoring
 * - Retry logic with exponential backoff
 * - Session scan counter
 * - Clear status indicators for agents
 *
 * Requirements:
 * - Chrome/Edge browser (Firefox/Safari don't support Web Serial)
 * - HTTPS or localhost
 * - User grants permission once (remembered permanently)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// PrehKeyTec MC147 default serial settings
const DEFAULT_SERIAL_OPTIONS = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
};

// Connection states for UI
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  READY: 'ready',           // Scanner enabled (DTR/RTS set, LED green)
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// MRZ data markers from PrehKeyTec scanner
const START_MARKER = '\x1c\x02';
const END_MARKER = '\x03\x1d';

// Retry configuration
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000;    // 30 seconds

/**
 * Parse MRZ data (88 characters, 2 lines of 44)
 * ICAO 9303 TD3 Format for Passports
 */
function parseMrz(mrzRaw) {
  let mrz = mrzRaw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\r?\n/g, '')
    .trim();

  if (mrz.length < 88) {
    console.warn(`[WebSerial] MRZ too short: ${mrz.length} chars (need 88)`);
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
    const dob = `${dobFullYear}-${dobRaw.substring(2, 4)}-${dobRaw.substring(4, 6)}`;

    const expiryYear = parseInt(expiryRaw.substring(0, 2));
    const expiryFullYear = expiryYear > 50 ? 1900 + expiryYear : 2000 + expiryYear;
    const dateOfExpiry = `${expiryFullYear}-${expiryRaw.substring(2, 4)}-${expiryRaw.substring(4, 6)}`;

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
    console.error('[WebSerial] MRZ parsing error:', error);
    return null;
  }
}

/**
 * Extract MRZ payload from raw scanner data
 */
function extractPayload(rawData) {
  const startIdx = rawData.indexOf(START_MARKER);
  const endIdx = rawData.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return rawData.substring(startIdx + START_MARKER.length, endIdx);
  }

  return rawData.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export function useWebSerial({
  onScan = null,
  onStatusChange = null,
  autoConnect = true,  // Default to auto-connect for production
  autoReconnect = true,
  serialOptions = DEFAULT_SERIAL_OPTIONS,
} = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [portInfo, setPortInfo] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState(null);
  const [rawBuffer, setRawBuffer] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const readLoopRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onStatusChangeRef = useRef(onStatusChange);
  const mountedRef = useRef(true);
  const hasConnectedRef = useRef(false);  // Track if we've ever connected this session
  const isAutoConnectingRef = useRef(false);  // Prevent concurrent auto-connect attempts

  // Keep callback refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    onStatusChangeRef.current = onStatusChange;
  });

  // Derived states for convenience
  const isConnected = connectionState === ConnectionState.CONNECTED ||
                      connectionState === ConnectionState.READY;
  const isReady = connectionState === ConnectionState.READY;
  const isConnecting = connectionState === ConnectionState.CONNECTING ||
                       connectionState === ConnectionState.RECONNECTING;

  // Update connection state and notify
  const updateState = useCallback((newState, errorMsg = null) => {
    if (!mountedRef.current) return;

    setConnectionState(newState);
    if (errorMsg) setError(errorMsg);
    else if (newState === ConnectionState.READY) setError(null);

    if (onStatusChangeRef.current) {
      onStatusChangeRef.current(newState, errorMsg);
    }

    console.log(`[WebSerial] State: ${newState}${errorMsg ? ` - ${errorMsg}` : ''}`);
  }, []);

  // Check Web Serial API support and track mount state
  useEffect(() => {
    // Reset mounted flag on each mount (important for React StrictMode)
    mountedRef.current = true;
    console.log('[WebSerial] Component mounted, checking Web Serial support...');

    const supported = 'serial' in navigator;
    setIsSupported(supported);

    if (!supported) {
      updateState(ConnectionState.ERROR, 'Web Serial API not supported. Use Chrome or Edge browser.');
    } else {
      console.log('[WebSerial] Web Serial API supported');
    }

    return () => {
      console.log('[WebSerial] Cleanup: setting mountedRef to false');
      mountedRef.current = false;
    };
  }, [updateState]);

  // Auto-connect on mount
  useEffect(() => {
    console.log('[WebSerial] Mount effect - autoConnect:', autoConnect, 'isSupported:', isSupported, 'state:', connectionState, 'hasConnected:', hasConnectedRef.current);

    // Only auto-connect if we haven't already and conditions are met
    if (autoConnect && isSupported && connectionState === ConnectionState.DISCONNECTED && !hasConnectedRef.current && !isAutoConnectingRef.current) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        autoConnectToPort();
      }, 500);  // Increased delay for React StrictMode
      return () => clearTimeout(timer);
    }
  }, [autoConnect, isSupported, connectionState]);

  // Listen for USB connect/disconnect events
  useEffect(() => {
    if (!isSupported) return;

    const handleConnect = (event) => {
      console.log('[WebSerial] USB device connected');
      if (autoReconnect && connectionState === ConnectionState.DISCONNECTED) {
        // Small delay to let the device initialize
        setTimeout(() => autoConnectToPort(), 500);
      }
    };

    const handleDisconnect = (event) => {
      console.log('[WebSerial] USB device disconnected');
      if (portRef.current === event.target) {
        handleConnectionLost();
      }
    };

    navigator.serial.addEventListener('connect', handleConnect);
    navigator.serial.addEventListener('disconnect', handleDisconnect);

    return () => {
      navigator.serial.removeEventListener('connect', handleConnect);
      navigator.serial.removeEventListener('disconnect', handleDisconnect);
    };
  }, [isSupported, autoReconnect, connectionState]);

  // Cleanup on unmount - DON'T disconnect, keep port available for page reload
  // The port permission persists in browser, and we want fast reconnect
  useEffect(() => {
    return () => {
      console.log('[WebSerial] Component unmounting - keeping port open for reconnect');
      clearTimeout(reconnectTimeoutRef.current);
      // Only stop the read loop, don't close the port
      // This allows faster reconnection on page reload
      readLoopRef.current = false;
      // Note: We intentionally do NOT call disconnect() here
      // The port will be closed when the browser tab is closed
    };
  }, []);

  /**
   * Handle connection lost - trigger reconnect if enabled
   */
  const handleConnectionLost = useCallback(() => {
    console.log('[WebSerial] Connection lost');

    readLoopRef.current = false;
    portRef.current = null;
    readerRef.current = null;
    setPortInfo(null);

    if (autoReconnect && mountedRef.current) {
      scheduleReconnect();
    } else {
      updateState(ConnectionState.DISCONNECTED);
    }
  }, [autoReconnect, updateState]);

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    const attempt = reconnectAttempt + 1;

    if (attempt > MAX_RECONNECT_ATTEMPTS) {
      updateState(ConnectionState.ERROR, 'Max reconnection attempts reached. Please reconnect manually.');
      setReconnectAttempt(0);
      return;
    }

    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt - 1), MAX_RECONNECT_DELAY);

    console.log(`[WebSerial] Scheduling reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    updateState(ConnectionState.RECONNECTING, `Reconnecting (attempt ${attempt})...`);
    setReconnectAttempt(attempt);

    reconnectTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      const success = await autoConnectToPort();
      if (!success && mountedRef.current) {
        scheduleReconnect();
      }
    }, delay);
  }, [reconnectAttempt, updateState]);

  /**
   * Auto-connect to a previously authorized port
   */
  const autoConnectToPort = async () => {
    if (!mountedRef.current) {
      console.log('[WebSerial] Auto-connect skipped - component unmounted');
      return false;
    }

    if (isAutoConnectingRef.current) {
      console.log('[WebSerial] Auto-connect skipped - already in progress');
      return false;
    }

    if (hasConnectedRef.current && portRef.current) {
      console.log('[WebSerial] Auto-connect skipped - already connected');
      return true;
    }

    isAutoConnectingRef.current = true;
    console.log('[WebSerial] Attempting auto-connect...');
    console.log('[WebSerial] Current origin:', window.location.origin);

    try {
      const ports = await navigator.serial.getPorts();
      console.log('[WebSerial] getPorts() returned', ports.length, 'port(s)');

      if (ports.length > 0) {
        // Try each port until one works
        for (let i = 0; i < ports.length; i++) {
          const port = ports[i];
          const portInfo = port.getInfo();
          console.log(`[WebSerial] Trying port ${i + 1}/${ports.length} - VendorID:`, portInfo.usbVendorId, 'ProductID:', portInfo.usbProductId);

          try {
            updateState(ConnectionState.CONNECTING);
            await connectToPort(port);
            hasConnectedRef.current = true;
            setReconnectAttempt(0);
            console.log('[WebSerial] Auto-connect successful!');
            isAutoConnectingRef.current = false;
            return true;
          } catch (portErr) {
            console.log(`[WebSerial] Port ${i + 1} failed:`, portErr.message);
            // Try next port
            continue;
          }
        }
        // All ports failed
        console.log('[WebSerial] All remembered ports failed to open');
        updateState(ConnectionState.ERROR, 'Could not open scanner port. Please click Reconnect.');
        isAutoConnectingRef.current = false;
        return false;
      } else {
        console.log('[WebSerial] No remembered ports found.');
        console.log('[WebSerial] User must click "Connect Scanner" once to authorize the device.');
        console.log('[WebSerial] Permissions are stored per-origin. Current origin:', window.location.origin);
        isAutoConnectingRef.current = false;
        return false;
      }
    } catch (err) {
      console.log('[WebSerial] Auto-connect failed:', err.message);
      isAutoConnectingRef.current = false;
      return false;
    }
  };

  /**
   * Request user to select a serial port and connect (one-time)
   */
  const connect = useCallback(async () => {
    if (!isSupported) {
      updateState(ConnectionState.ERROR, 'Web Serial API not supported');
      return false;
    }

    if (isConnected) {
      console.log('[WebSerial] Already connected');
      return true;
    }

    console.log('[WebSerial] Manual connect requested...');
    updateState(ConnectionState.CONNECTING);
    clearTimeout(reconnectTimeoutRef.current);

    try {
      const port = await navigator.serial.requestPort();
      console.log('[WebSerial] User selected port, connecting...');
      await connectToPort(port);
      hasConnectedRef.current = true;  // Mark as connected for this session
      setReconnectAttempt(0);
      console.log('[WebSerial] Manual connect successful! Port will be remembered for auto-connect.');
      return true;
    } catch (err) {
      if (err.name === 'NotFoundError') {
        console.log('[WebSerial] User cancelled port selection');
        updateState(ConnectionState.DISCONNECTED, 'No port selected');
      } else {
        console.log('[WebSerial] Connection failed:', err.message);
        updateState(ConnectionState.ERROR, `Connection failed: ${err.message}`);
      }
      return false;
    }
  }, [isSupported, isConnected, updateState]);

  /**
   * Connect to a specific port and enable scanner
   */
  const connectToPort = async (port) => {
    try {
      // Check if port is already open
      if (port.readable) {
        console.log('[WebSerial] Port already open, reusing existing connection...');
        // If port is already readable and we have a reader, we're good
        if (portRef.current === port && readLoopRef.current) {
          console.log('[WebSerial] Already reading from this port, just update state');
          updateState(ConnectionState.READY);
          return;
        }
      } else {
        console.log('[WebSerial] Opening port with settings:', serialOptions);
        try {
          await port.open(serialOptions);
          console.log('[WebSerial] Port opened successfully');
        } catch (openErr) {
          // Port might be stuck from previous session - try to close and reopen
          console.log('[WebSerial] First open attempt failed, trying to recover...');
          try {
            await port.close();
            console.log('[WebSerial] Closed stale port, retrying open...');
          } catch (closeErr) {
            // Port wasn't actually open, continue
            console.log('[WebSerial] Port close failed (expected):', closeErr.message);
          }
          // Wait a moment for the port to be released
          await new Promise(resolve => setTimeout(resolve, 500));
          // Try opening again
          await port.open(serialOptions);
          console.log('[WebSerial] Port opened successfully on retry');
        }
      }

      portRef.current = port;

      const info = port.getInfo();
      setPortInfo({
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
      });

      console.log('[WebSerial] Connected to port - VendorID:', info.usbVendorId, 'ProductID:', info.usbProductId);
      updateState(ConnectionState.CONNECTED);

      // Set DTR/RTS to enable scanner (Accept LED → GREEN)
      // P6 models may need signals set multiple times or with delay
      try {
        // First, ensure signals are cleared
        await port.setSignals({
          dataTerminalReady: false,
          requestToSend: false,
        });

        // Small delay for hardware to register
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now set signals active
        await port.setSignals({
          dataTerminalReady: true,
          requestToSend: true,
        });

        console.log('[WebSerial] DTR/RTS set - scanner enabled (LED should be GREEN)');

        // Additional delay for P6 hardware initialization
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify signals are still set (some hardware resets them)
        await port.setSignals({
          dataTerminalReady: true,
          requestToSend: true,
        });

        updateState(ConnectionState.READY);
      } catch (signalErr) {
        console.warn('[WebSerial] Could not set DTR/RTS:', signalErr.message);
        updateState(ConnectionState.READY); // Continue anyway
      }

      // Start reading
      startReading(port);
    } catch (err) {
      updateState(ConnectionState.ERROR, `Failed to open port: ${err.message}`);
      throw err;
    }
  };

  /**
   * Continuous reading loop from serial port
   */
  const startReading = async (port) => {
    readLoopRef.current = true;
    let buffer = '';

    while (port.readable && readLoopRef.current && mountedRef.current) {
      // Check if stream is already locked (reader exists from previous session)
      if (port.readable.locked) {
        console.log('[WebSerial] ReadableStream already locked, waiting for release...');
        // If we have a reference to the old reader, try to release it
        if (readerRef.current) {
          try {
            readerRef.current.releaseLock();
            console.log('[WebSerial] Released existing reader lock');
          } catch (e) {
            console.log('[WebSerial] Could not release lock:', e.message);
          }
        }
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 100));
        if (port.readable.locked) {
          console.log('[WebSerial] Stream still locked, skipping read - existing reader active');
          return; // Let the existing reader continue
        }
      }

      const reader = port.readable.getReader();
      readerRef.current = reader;

      try {
        while (readLoopRef.current && mountedRef.current) {
          const { value, done } = await reader.read();
          if (done) {
            console.log('[WebSerial] Reader done signal received');
            break;
          }

          const text = new TextDecoder().decode(value);
          buffer += text;

          // Check for complete scan data
          if (buffer.includes(END_MARKER) || buffer.includes('\x03')) {
            console.log('[WebSerial] Complete scan data received');
            processBuffer(buffer);
            buffer = '';
          }

          // Prevent buffer overflow
          if (buffer.length > 1000) {
            console.warn('[WebSerial] Buffer overflow, clearing');
            buffer = '';
          }
        }
      } catch (err) {
        if (err.name === 'NetworkError' || err.message.includes('device has been lost')) {
          console.log('[WebSerial] Device disconnected');
          handleConnectionLost();
          return;
        } else if (readLoopRef.current && mountedRef.current) {
          console.error('[WebSerial] Read error:', err);
          updateState(ConnectionState.ERROR, `Read error: ${err.message}`);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  /**
   * Process received buffer and extract MRZ
   */
  const processBuffer = (buffer) => {
    if (!mountedRef.current) return;

    setRawBuffer(buffer);

    const payload = extractPayload(buffer);
    console.log('[WebSerial] Extracted payload:', payload.substring(0, 50) + '...');

    const parsed = parseMrz(payload);

    if (parsed) {
      console.log('[WebSerial] Parsed MRZ:', parsed.passport_no, parsed.surname, parsed.given_name);
      setLastScan(parsed);
      setScanCount(prev => prev + 1);
      setError(null);

      if (onScanRef.current) {
        onScanRef.current(parsed);
      }
    } else {
      console.warn('[WebSerial] Failed to parse MRZ');
      setError('Failed to parse passport data - please rescan');
    }
  };

  /**
   * Disconnect from the serial port
   */
  const disconnect = useCallback(async () => {
    console.log('[WebSerial] Disconnect called');
    readLoopRef.current = false;
    clearTimeout(reconnectTimeoutRef.current);

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) {
        // Ignore
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.setSignals({
          dataTerminalReady: false,
          requestToSend: false,
        });
      } catch (err) {
        // Ignore
      }
      try {
        await portRef.current.close();
      } catch (err) {
        // Ignore
      }
      portRef.current = null;
    }

    setPortInfo(null);
    updateState(ConnectionState.DISCONNECTED);
    console.log('[WebSerial] Disconnected');
  }, [updateState]);

  /**
   * Clear the last scan result (for next passport)
   */
  const clearScan = useCallback(() => {
    setLastScan(null);
    setRawBuffer('');
    setError(null);
  }, []);

  /**
   * Reset scan counter (for new shift/session)
   */
  const resetScanCount = useCallback(() => {
    setScanCount(0);
  }, []);

  /**
   * Force reconnection attempt
   */
  const reconnect = useCallback(async () => {
    await disconnect();
    setReconnectAttempt(0);
    return await connect();
  }, [disconnect, connect]);

  return {
    // State
    isSupported,
    connectionState,
    isConnected,
    isConnecting,
    isReady,
    portInfo,
    lastScan,
    error,
    rawBuffer,
    scanCount,
    reconnectAttempt,

    // Actions
    connect,
    disconnect,
    reconnect,
    clearScan,
    resetScanCount,
  };
}

export default useWebSerial;
