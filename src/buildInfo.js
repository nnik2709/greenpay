/**
 * Build Information
 * Auto-generated during build process
 * DO NOT EDIT MANUALLY - This file is overwritten on each build
 *
 * Generated: 2026-01-25T15:24:54.406Z
 * Check in browser console: window.__BUILD_INFO__
 */

export const BUILD_INFO = {
  version: '0.0.0',
  buildTime: '2026-01-25T15:24:54.406Z',
  buildTimestamp: 1769354694406,
  buildDate: '01/25/2026, 16:24:54',
  gitBranch: 'main',
  gitCommit: 'f2461a5',
  environment: 'production'
};

// Expose to window for easy checking in browser console
if (typeof window !== 'undefined') {
  window.__BUILD_INFO__ = BUILD_INFO;

  // Log build info on load
  console.log(
    '%c🚀 GreenPay Build Info',
    'color: #10b981; font-size: 16px; font-weight: bold; padding: 8px 0;'
  );
  console.log('%cVersion:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.version);
  console.log('%cBuild Time:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.buildDate);
  console.log('%cGit:', 'color: #3b82f6; font-weight: bold', `${BUILD_INFO.gitBranch}@${BUILD_INFO.gitCommit}`);
  console.log('%cEnvironment:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.environment);
  console.log('%cTimestamp:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.buildTimestamp);
  console.log(
    '%c💡 Tip: Type window.__BUILD_INFO__ to see full build details',
    'color: #6b7280; font-style: italic'
  );
}

export default BUILD_INFO;
