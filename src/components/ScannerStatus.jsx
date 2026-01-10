/**
 * ScannerStatus - Scanner Connection Status Indicator
 *
 * Shows the current status of the passport scanner connection.
 * Can be placed in the header for persistent visibility.
 *
 * Features:
 * - Color-coded status indicator (green/yellow/red)
 * - Scan counter for the session
 * - One-click connect button for first-time setup
 * - Compact mode for header integration
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionState } from '@/hooks/useWebSerial';

const statusConfig = {
  [ConnectionState.DISCONNECTED]: {
    color: 'bg-slate-400',
    label: 'Scanner Offline',
    description: 'Click to connect',
    showConnect: true,
  },
  [ConnectionState.CONNECTING]: {
    color: 'bg-yellow-500 animate-pulse',
    label: 'Connecting...',
    description: 'Please wait',
    showConnect: false,
  },
  [ConnectionState.CONNECTED]: {
    color: 'bg-yellow-500',
    label: 'Connected',
    description: 'Initializing scanner',
    showConnect: false,
  },
  [ConnectionState.READY]: {
    color: 'bg-green-500',
    label: 'Scanner Ready',
    description: 'Ready to scan',
    showConnect: false,
  },
  [ConnectionState.RECONNECTING]: {
    color: 'bg-yellow-500 animate-pulse',
    label: 'Reconnecting...',
    description: 'Connection lost',
    showConnect: false,
  },
  [ConnectionState.ERROR]: {
    color: 'bg-red-500',
    label: 'Error',
    description: 'Click to reconnect',
    showConnect: true,
  },
};

/**
 * Compact status indicator for header
 */
export function ScannerStatusCompact({
  connectionState,
  scanCount,
  onConnect,
  isSupported,
}) {
  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Scanner N/A</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <button
        onClick={config.showConnect ? onConnect : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
          config.showConnect
            ? 'hover:bg-slate-100 cursor-pointer'
            : 'cursor-default'
        }`}
        title={config.description}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <span className="text-sm font-medium text-slate-700">{config.label}</span>
      </button>

      {/* Scan counter */}
      {connectionState === ConnectionState.READY && scanCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {scanCount} scanned
        </Badge>
      )}
    </div>
  );
}

/**
 * Full status indicator with more details
 */
export function ScannerStatusFull({
  connectionState,
  scanCount,
  error,
  onConnect,
  onDisconnect,
  onReconnect,
  isSupported,
  reconnectAttempt,
}) {
  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 text-amber-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Web Serial not supported</span>
        </div>
        <p className="mt-1 text-sm text-amber-700">
          Please use Chrome or Edge browser for passport scanning.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      connectionState === ConnectionState.READY
        ? 'bg-green-50 border-green-200'
        : connectionState === ConnectionState.ERROR
          ? 'bg-red-50 border-red-200'
          : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${config.color}`} />
          <div>
            <div className="font-semibold text-slate-900">{config.label}</div>
            <div className="text-sm text-slate-600">
              {error || config.description}
              {reconnectAttempt > 0 && connectionState === ConnectionState.RECONNECTING && (
                <span className="ml-1">(Attempt {reconnectAttempt}/5)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scan counter */}
          {scanCount > 0 && (
            <div className="text-right mr-4">
              <div className="text-2xl font-bold text-green-600">{scanCount}</div>
              <div className="text-xs text-slate-500">passports scanned</div>
            </div>
          )}

          {/* Action buttons */}
          {connectionState === ConnectionState.DISCONNECTED && (
            <Button onClick={onConnect} className="bg-emerald-600 hover:bg-emerald-700">
              Connect Scanner
            </Button>
          )}

          {connectionState === ConnectionState.ERROR && (
            <Button onClick={onReconnect} variant="outline" className="border-red-500 text-red-600">
              Reconnect
            </Button>
          )}

          {connectionState === ConnectionState.READY && (
            <Button onClick={onDisconnect} variant="outline" size="sm">
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Floating status badge for corner of screen
 */
export function ScannerStatusBadge({
  connectionState,
  scanCount,
  onConnect,
  isSupported,
}) {
  if (!isSupported) return null;

  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];
  const isReady = connectionState === ConnectionState.READY;

  return (
    <div
      onClick={config.showConnect ? onConnect : undefined}
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
        isReady ? 'bg-green-500 text-white' : 'bg-white border border-slate-200'
      } ${config.showConnect ? 'cursor-pointer hover:shadow-xl' : ''}`}
    >
      <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-white' : config.color}`} />
      <span className={`font-medium ${isReady ? 'text-white' : 'text-slate-700'}`}>
        {config.label}
      </span>
      {isReady && scanCount > 0 && (
        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
          {scanCount}
        </span>
      )}
    </div>
  );
}

export default ScannerStatusFull;
