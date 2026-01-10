/**
 * useComBridgeScanner Hook
 *
 * Connects to the PrehKeyTec COM Bridge WebSocket service to receive
 * real-time passport scan data from the MRZ scanner.
 *
 * The COM Bridge service (python-com-bridge/com_bridge.py) reads from
 * COM29 (PrehKeyTec Virtual COM Port) and broadcasts parsed MRZ data
 * via WebSocket.
 *
 * @example
 * const { isConnected, lastScan, error, connect, disconnect } = useComBridgeScanner({
 *   onScan: (data) => {
 *     console.log('Passport scanned:', data.passportNumber);
 *     setPassportNumber(data.passportNumber);
 *   }
 * });
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_WS_URL = 'ws://localhost:8765';

// Common ports to check for passport scanner services
const SCANNER_PORTS = [8765, 8080, 9000, 5000, 3001, 8000, 9001];

// Try to detect available scanner service
export async function detectScannerService() {
  const results = [];

  for (const port of SCANNER_PORTS) {
    try {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ port, available: false, error: 'timeout' });
        }, 1000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ port, available: true });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({ port, available: false, error: 'connection failed' });
        };
      });

      results.push(result);
    } catch (e) {
      results.push({ port, available: false, error: e.message });
    }
  }

  return results;
}

// Singleton WebSocket manager to survive React StrictMode double-mounting
const wsManager = {
  ws: null,
  currentUrl: null,
  listeners: new Set(),
  connectPromise: null,

  addListener(callback) {
    this.listeners.add(callback);
  },

  removeListener(callback) {
    this.listeners.delete(callback);
  },

  broadcast(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  },

  connect(url) {
    // If already connected to same URL, return existing connection
    if (this.ws?.readyState === WebSocket.OPEN && this.currentUrl === url) {
      return Promise.resolve(this.ws);
    }

    // If connecting to same URL, wait for it
    if (this.ws?.readyState === WebSocket.CONNECTING && this.currentUrl === url) {
      return this.connectPromise;
    }

    // If connected to different URL, disconnect first
    if (this.ws && this.currentUrl !== url) {
      console.log('[ComBridge] Switching from', this.currentUrl, 'to', url);
      this.ws.close();
      this.ws = null;
    }

    this.currentUrl = url;
    this.connectPromise = new Promise((resolve, reject) => {
      console.log('[ComBridge] Creating WebSocket connection to', url);
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.log('[ComBridge] WebSocket connected');
        this.broadcast('open', null);
        resolve(ws);
      };

      ws.onclose = (event) => {
        console.log('[ComBridge] WebSocket closed', event.code, event.reason);
        this.ws = null;
        this.connectPromise = null;
        this.broadcast('close', event);
      };

      ws.onerror = (event) => {
        console.error('[ComBridge] WebSocket error', event);
        this.broadcast('error', event);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onmessage = (event) => {
        this.broadcast('message', event);
      };
    });

    return this.connectPromise;
  },

  disconnect() {
    if (this.ws) {
      console.log('[ComBridge] Closing WebSocket');
      this.ws.close();
      this.ws = null;
      this.currentUrl = null;
      this.connectPromise = null;
    }
  },

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  },

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
};

/**
 * Hook for connecting to PrehKeyTec COM Bridge WebSocket service
 *
 * @param {Object} options
 * @param {string} options.wsUrl - WebSocket URL (default: ws://localhost:8765)
 * @param {function} options.onScan - Callback when scan is received
 * @param {function} options.onConnect - Callback when connected
 * @param {function} options.onDisconnect - Callback when disconnected
 * @param {function} options.onError - Callback on error
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {boolean} options.autoReconnect - Auto-reconnect on disconnect (default: true)
 * @param {number} options.reconnectDelay - Delay before reconnect in ms (default: 3000)
 */
export const useComBridgeScanner = ({
  wsUrl = DEFAULT_WS_URL,
  onScan,
  onConnect,
  onDisconnect,
  onError,
  autoConnect = true,
  autoReconnect = true,
  reconnectDelay = 3000,
} = {}) => {
  const [isConnected, setIsConnected] = useState(wsManager.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [error, setError] = useState(null);
  const [comPortStatus, setComPortStatus] = useState(null);

  const reconnectTimeoutRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  });

  // Handle WebSocket events
  const handleWsEvent = useCallback((event, data) => {
    switch (event) {
      case 'open':
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        if (onConnectRef.current) onConnectRef.current();
        break;

      case 'close':
        setIsConnected(false);
        setIsConnecting(false);
        if (onDisconnectRef.current) onDisconnectRef.current();

        // Auto-reconnect
        if (autoReconnect) {
          console.log(`[ComBridge] Reconnecting in ${reconnectDelay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            wsManager.connect(wsUrl).catch(() => {});
          }, reconnectDelay);
        }
        break;

      case 'error':
        const errorMsg = 'Failed to connect to COM Bridge service. Is it running?';
        setError(errorMsg);
        setIsConnecting(false);
        if (onErrorRef.current) onErrorRef.current(new Error(errorMsg));
        break;

      case 'message':
        try {
          const msgData = JSON.parse(data.data);
          console.log('[ComBridge] Message received:', msgData);

          switch (msgData.type) {
            case 'connected':
              console.log('[ComBridge] Service connected');
              break;

            case 'com_connected':
              setComPortStatus('connected');
              console.log(`[ComBridge] COM port ${msgData.port} connected`);
              break;

            case 'com_error':
              setComPortStatus('error');
              setError(msgData.error);
              console.error('[ComBridge] COM port error:', msgData.error);
              break;

            case 'mrz':
              if (msgData.success) {
                setLastScan(msgData);
                setScanHistory(prev => [msgData, ...prev].slice(0, 20));
                setError(null);
                console.log('[ComBridge] MRZ scan received:', {
                  passport: msgData.passportNumber,
                  name: `${msgData.givenName} ${msgData.surname}`,
                  nationality: msgData.nationality,
                });
                if (onScanRef.current) onScanRef.current(msgData);
              }
              break;

            case 'barcode':
              if (msgData.success) {
                setLastScan(msgData);
                setScanHistory(prev => [msgData, ...prev].slice(0, 20));
                console.log('[ComBridge] Barcode scan received:', msgData.value);
                if (onScanRef.current) onScanRef.current(msgData);
              }
              break;

            case 'pong':
              console.log('[ComBridge] Pong received');
              break;

            case 'status':
              setComPortStatus(msgData.comPort ? 'connected' : 'disconnected');
              break;

            default:
              console.log('[ComBridge] Unknown message type:', msgData.type);
          }
        } catch (e) {
          console.error('[ComBridge] Error parsing message:', e);
        }
        break;
    }
  }, [wsUrl, autoReconnect, reconnectDelay]);

  // Register event listener
  useEffect(() => {
    wsManager.addListener(handleWsEvent);

    // Sync initial state
    setIsConnected(wsManager.isConnected());

    return () => {
      wsManager.removeListener(handleWsEvent);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleWsEvent]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && !wsManager.isConnected()) {
      wsManager.connect(wsUrl).catch(() => {});
    }
  }, [autoConnect, wsUrl]);

  // Connect function
  const connect = useCallback(() => {
    if (wsManager.isConnected()) {
      console.log('[ComBridge] Already connected');
      return;
    }

    if (isConnecting) {
      console.log('[ComBridge] Connection in progress');
      return;
    }

    setIsConnecting(true);
    setError(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    wsManager.connect(wsUrl).catch(err => {
      setError(err.message);
      setIsConnecting(false);
    });
  }, [wsUrl, isConnecting]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    wsManager.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Send command
  const sendCommand = useCallback((command, data = {}) => {
    wsManager.send(JSON.stringify({ command, ...data }));
  }, []);

  // Ping
  const ping = useCallback(() => {
    sendCommand('ping');
  }, [sendCommand]);

  // Request status
  const requestStatus = useCallback(() => {
    sendCommand('status');
  }, [sendCommand]);

  // Clear history
  const clearHistory = useCallback(() => {
    setScanHistory([]);
    setLastScan(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    lastScan,
    scanHistory,
    error,
    comPortStatus,
    connect,
    disconnect,
    ping,
    requestStatus,
    clearHistory,
  };
};

export default useComBridgeScanner;
