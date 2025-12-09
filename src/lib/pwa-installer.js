/**
 * PWA Installation and Service Worker Registration
 * Optimized for PNG network conditions
 */

let deferredPrompt = null;
let serviceWorkerRegistration = null;

/**
 * Register Service Worker
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported');
    return null;
  }

  try {
    // Register service worker
    serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('[PWA] Service Worker registered:', serviceWorkerRegistration.scope);

    // Check for updates every 5 minutes
    setInterval(() => {
      serviceWorkerRegistration.update();
    }, 5 * 60 * 1000);

    // Handle service worker updates
    serviceWorkerRegistration.addEventListener('updatefound', () => {
      const newWorker = serviceWorkerRegistration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('[PWA] New version available');

          // Notify user about update
          if (window.confirm('A new version is available. Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle controlling service worker change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed - reloading');
      window.location.reload();
    });

    return serviceWorkerRegistration;

  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister Service Worker (for debugging)
 */
export const unregisterServiceWorker = async () => {
  if (!serviceWorkerRegistration) return;

  try {
    await serviceWorkerRegistration.unregister();
    console.log('[PWA] Service Worker unregistered');

    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] Caches cleared');
    }

    window.location.reload();
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
  }
};

/**
 * Check if app is installed
 */
export const isAppInstalled = () => {
  // Check if running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    console.log('[PWA] Install prompt outcome:', outcome);

    // Clear the deferred prompt
    deferredPrompt = null;

    return outcome === 'accepted';

  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
};

/**
 * Listen for install prompt
 */
export const setupInstallPrompt = (callback) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available');

    // Prevent the default prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e;

    // Notify the app
    if (callback) {
      callback(true);
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');

    // Clear the deferred prompt
    deferredPrompt = null;

    // Notify the app
    if (callback) {
      callback(false);
    }
  });
};

/**
 * Request Background Sync permission
 */
export const requestBackgroundSync = async (tag = 'sync-purchase-queue') => {
  if (!serviceWorkerRegistration) {
    console.log('[PWA] Service Worker not registered');
    return false;
  }

  if (!('sync' in serviceWorkerRegistration)) {
    console.log('[PWA] Background Sync not supported');
    return false;
  }

  try {
    await serviceWorkerRegistration.sync.register(tag);
    console.log('[PWA] Background Sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[PWA] Background Sync registration failed:', error);
    return false;
  }
};

/**
 * Request Push Notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[PWA] Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('[PWA] Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[PWA] Notification permission request failed:', error);
    return false;
  }
};

/**
 * Show local notification
 */
export const showNotification = async (title, options = {}) => {
  if (!serviceWorkerRegistration) {
    console.log('[PWA] Service Worker not registered');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('[PWA] Notification permission not granted');
    return;
  }

  try {
    await serviceWorkerRegistration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      ...options
    });

    console.log('[PWA] Notification shown:', title);
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
  }
};

/**
 * Get network status
 */
export const getNetworkStatus = () => {
  return {
    online: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null,
    rtt: navigator.connection?.rtt || null,
    saveData: navigator.connection?.saveData || false
  };
};

/**
 * Monitor network status
 */
export const monitorNetworkStatus = (callback) => {
  const handleOnline = () => {
    console.log('[PWA] Network: Online');
    callback({ online: true, ...getNetworkStatus() });
  };

  const handleOffline = () => {
    console.log('[PWA] Network: Offline');
    callback({ online: false });
  };

  const handleConnectionChange = () => {
    console.log('[PWA] Network: Connection changed');
    callback(getNetworkStatus());
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (navigator.connection) {
    navigator.connection.addEventListener('change', handleConnectionChange);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    if (navigator.connection) {
      navigator.connection.removeEventListener('change', handleConnectionChange);
    }
  };
};

/**
 * Clear all caches (for debugging)
 */
export const clearAllCaches = async () => {
  if (!('caches' in window)) {
    console.log('[PWA] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[PWA] All caches cleared');

    // Notify service worker to clear its caches too
    if (serviceWorkerRegistration && serviceWorkerRegistration.active) {
      serviceWorkerRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
  }
};

/**
 * Get PWA info
 */
export const getPWAInfo = () => {
  return {
    isInstalled: isAppInstalled(),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    canInstall: deferredPrompt !== null,
    serviceWorkerRegistered: serviceWorkerRegistration !== null,
    notificationPermission: Notification?.permission || 'unsupported',
    online: navigator.onLine,
    connection: getNetworkStatus()
  };
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isAppInstalled,
  showInstallPrompt,
  setupInstallPrompt,
  requestBackgroundSync,
  requestNotificationPermission,
  showNotification,
  getNetworkStatus,
  monitorNetworkStatus,
  clearAllCaches,
  getPWAInfo
};
