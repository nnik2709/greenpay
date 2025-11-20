/**
 * ScannerInput Component
 *
 * A reusable input component with built-in hardware scanner support.
 * Works with USB keyboard wedge scanners (passport MRZ, barcode, QR code).
 *
 * Features:
 * - Visual scanning indicator
 * - Auto-submit on scan complete
 * - MRZ parsing support
 * - Success/error feedback
 * - Customizable appearance
 *
 * @example
 * <ScannerInput
 *   placeholder="Scan or enter passport number"
 *   onScanComplete={handleScan}
 *   enableMrzParsing={true}
 *   showScannerIcon={true}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, CheckCircle, XCircle, Loader2, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useScannerInput } from '@/hooks/useScannerInput';
import { cn } from '@/lib/utils';

const ScannerInput = ({
  // Scanner options
  onScanComplete,
  onScanError,
  enableMrzParsing = true,
  minLength = 5,
  scanTimeout = 100,
  autoSubmit = true,
  preventManualInput = false,
  debugMode = false,

  // Input options
  placeholder = 'Scan or enter value...',
  disabled = false,
  showScannerIcon = true,
  showStatusIndicator = true,
  autoFocus = false,
  className = '',

  // Manual input handling
  allowManualEntry = true,
  onManualSubmit,

  // Styling
  scanningClassName = 'border-emerald-500 ring-2 ring-emerald-200',
  successClassName = 'border-green-500',
  errorClassName = 'border-red-500',

  // Additional props
  ...inputProps
}) => {
  const [manualValue, setManualValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef(null);
  const successTimeout = useRef(null);
  const errorTimeout = useRef(null);

  // Initialize scanner hook
  const { isScanning, lastScanData, clearScanner } = useScannerInput({
    onScanComplete: (data) => {
      if (debugMode) {
        console.log('[ScannerInput] Scan complete:', data);
      }

      // Show success indicator
      setShowSuccess(true);
      clearTimeout(successTimeout.current);
      successTimeout.current = setTimeout(() => setShowSuccess(false), 2000);

      // Clear manual input
      setManualValue('');

      // Trigger callback
      if (onScanComplete) {
        onScanComplete(data);
      }
    },
    onScanError: (error) => {
      if (debugMode) {
        console.error('[ScannerInput] Scan error:', error);
      }

      // Show error indicator
      setShowError(true);
      clearTimeout(errorTimeout.current);
      errorTimeout.current = setTimeout(() => setShowError(false), 2000);

      // Trigger callback
      if (onScanError) {
        onScanError(error);
      }
    },
    minLength,
    scanTimeout,
    enableMrzParsing,
    autoSubmit,
    preventManualInput,
    debugMode
  });

  // Handle manual input change
  const handleManualChange = (e) => {
    if (!allowManualEntry) return;
    setManualValue(e.target.value);
  };

  // Handle manual submit (Enter key)
  const handleManualKeyDown = (e) => {
    if (e.key === 'Enter' && allowManualEntry && manualValue.trim()) {
      e.preventDefault();

      if (onManualSubmit) {
        onManualSubmit(manualValue.trim());
      } else if (onScanComplete) {
        // Treat manual entry as simple scan
        onScanComplete({
          type: 'manual',
          value: manualValue.trim(),
          raw: manualValue,
          length: manualValue.trim().length
        });
      }

      setManualValue('');
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(successTimeout.current);
      clearTimeout(errorTimeout.current);
    };
  }, []);

  // Determine input state
  const getInputClassName = () => {
    if (isScanning) return scanningClassName;
    if (showSuccess) return successClassName;
    if (showError) return errorClassName;
    return '';
  };

  // Status icon
  const StatusIcon = () => {
    if (!showStatusIndicator) return null;

    if (isScanning) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <ScanLine className="w-5 h-5 text-emerald-600 animate-pulse" />
        </motion.div>
      );
    }

    if (showSuccess) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
        </motion.div>
      );
    }

    if (showError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <XCircle className="w-5 h-5 text-red-600" />
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Scanner Icon */}
      {showScannerIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <Hash className={cn(
            'w-5 h-5 transition-colors',
            isScanning ? 'text-emerald-600' : 'text-slate-400'
          )} />
        </div>
      )}

      {/* Input Field */}
      <Input
        ref={inputRef}
        value={manualValue}
        onChange={handleManualChange}
        onKeyDown={handleManualKeyDown}
        placeholder={isScanning ? 'Scanning...' : placeholder}
        disabled={disabled || isScanning}
        className={cn(
          'transition-all duration-200',
          showScannerIcon ? 'pl-10' : '',
          showStatusIndicator ? 'pr-10' : '',
          getInputClassName()
        )}
        {...inputProps}
      />

      {/* Status Indicator */}
      <AnimatePresence mode="wait">
        <StatusIcon />
      </AnimatePresence>

      {/* Scanning Animation Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-md overflow-hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScannerInput;
