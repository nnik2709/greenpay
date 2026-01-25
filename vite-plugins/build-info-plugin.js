/**
 * Vite Plugin: Build Info Generator
 *
 * Automatically generates buildInfo.js with current timestamp and git info
 * during the build process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function buildInfoPlugin() {
  return {
    name: 'build-info-generator',

    buildStart() {
      const now = new Date();
      const buildTimestamp = now.getTime();
      const buildTime = now.toISOString();
      const buildDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Try to get git branch
      let gitBranch = 'unknown';
      try {
        gitBranch = execSync('git rev-parse --abbrev-ref HEAD')
          .toString()
          .trim();
      } catch (e) {
        console.warn('[BuildInfo] Could not get git branch:', e.message);
      }

      // Try to get git commit hash
      let gitCommit = 'unknown';
      try {
        gitCommit = execSync('git rev-parse --short HEAD')
          .toString()
          .trim();
      } catch (e) {
        console.warn('[BuildInfo] Could not get git commit:', e.message);
      }

      // Get environment from Vite config
      const environment = process.env.NODE_ENV || 'production';

      // Get package version
      let version = '1.0.0';
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8')
        );
        version = packageJson.version || '1.0.0';
      } catch (e) {
        console.warn('[BuildInfo] Could not read package.json version');
      }

      // Generate build info file
      const buildInfoContent = `/**
 * Build Information
 * Auto-generated during build process
 * DO NOT EDIT MANUALLY - This file is overwritten on each build
 *
 * Generated: ${buildTime}
 * Check in browser console: window.__BUILD_INFO__
 */

export const BUILD_INFO = {
  version: '${version}',
  buildTime: '${buildTime}',
  buildTimestamp: ${buildTimestamp},
  buildDate: '${buildDate}',
  gitBranch: '${gitBranch}',
  gitCommit: '${gitCommit}',
  environment: '${environment}'
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
  console.log('%cGit:', 'color: #3b82f6; font-weight: bold', \`\${BUILD_INFO.gitBranch}@\${BUILD_INFO.gitCommit}\`);
  console.log('%cEnvironment:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.environment);
  console.log('%cTimestamp:', 'color: #3b82f6; font-weight: bold', BUILD_INFO.buildTimestamp);
  console.log(
    '%c💡 Tip: Type window.__BUILD_INFO__ to see full build details',
    'color: #6b7280; font-style: italic'
  );
}

export default BUILD_INFO;
`;

      // Write to src/buildInfo.js
      const buildInfoPath = path.resolve(process.cwd(), 'src/buildInfo.js');
      fs.writeFileSync(buildInfoPath, buildInfoContent, 'utf-8');

      console.log('\n' + '='.repeat(60));
      console.log('🔨 BUILD INFO GENERATED');
      console.log('='.repeat(60));
      console.log(`Version:     ${version}`);
      console.log(`Build Time:  ${buildDate}`);
      console.log(`Git Branch:  ${gitBranch}`);
      console.log(`Git Commit:  ${gitCommit}`);
      console.log(`Environment: ${environment}`);
      console.log(`Timestamp:   ${buildTimestamp}`);
      console.log('='.repeat(60) + '\n');
    },

    configureServer(server) {
      // In dev mode, regenerate on file change for accurate timestamp
      server.watcher.on('change', () => {
        // Regenerate less frequently in dev mode to avoid excessive rebuilds
        // Only on actual code changes, not every hot reload
      });
    }
  };
}
