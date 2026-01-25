/**
 * Build Version Indicator
 * Shows build timestamp in bottom-right corner (dev/staging only)
 */

import React, { useState } from 'react';
import { BUILD_INFO } from '@/buildInfo';

export const BuildVersion = () => {
  const [expanded, setExpanded] = useState(false);

  // Only show in development or when explicitly enabled
  const showVersion = import.meta.env.DEV || import.meta.env.VITE_SHOW_BUILD_VERSION === 'true';

  if (!showVersion) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white text-xs rounded-lg shadow-lg cursor-pointer transition-all hover:bg-gray-700"
      onClick={() => setExpanded(!expanded)}
      title="Click to expand build info"
    >
      {expanded ? (
        <div className="p-3 space-y-1 min-w-[200px]">
          <div className="font-bold text-green-400 mb-2">Build Info</div>
          <div className="flex justify-between">
            <span className="text-gray-400">Version:</span>
            <span className="font-mono">{BUILD_INFO.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Build:</span>
            <span className="font-mono">{BUILD_INFO.buildDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Env:</span>
            <span className="font-mono">{BUILD_INFO.environment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timestamp:</span>
            <span className="font-mono text-xs">{BUILD_INFO.buildTimestamp}</span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 font-mono">
          v{BUILD_INFO.version} • {new Date(BUILD_INFO.buildTimestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default BuildVersion;
