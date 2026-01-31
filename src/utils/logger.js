/**
 * Development-only logging utilities
 * Prevents console output in production builds for security and performance
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Debug message:', data);
 *   logger.error('Error occurred:', error);
 *
 * @module logger
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (console.log replacement)
   * Only outputs in development mode
   */
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  /**
   * Log error messages (console.error replacement)
   * Only outputs in development mode
   */
  error: (...args) => {
    if (isDev) console.error(...args);
  },

  /**
   * Log warning messages (console.warn replacement)
   * Only outputs in development mode
   */
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Log informational messages (console.info replacement)
   * Only outputs in development mode
   */
  info: (...args) => {
    if (isDev) console.info(...args);
  },

  /**
   * Log debug messages (console.debug replacement)
   * Only outputs in development mode
   */
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },

  /**
   * Log table data (console.table replacement)
   * Only outputs in development mode
   */
  table: (...args) => {
    if (isDev) console.table(...args);
  }
};

// Export individual functions for convenience
export const { log, error, warn, info, debug, table } = logger;

// Default export
export default logger;
