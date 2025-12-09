import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import '@/lib/testSupabase';
import { AuthProvider } from '@/contexts/AuthContext';
import { registerServiceWorker } from '@/lib/pwa-installer';

// Register Service Worker for offline support (PNG network optimization)
// TEMPORARILY DISABLED FOR TESTING
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     registerServiceWorker().then(registration => {
//       if (registration) {
//         console.log('✅ PWA features enabled - Offline support active');
//       }
//     }).catch(error => {
//       console.error('❌ PWA registration failed:', error);
//     });
//   });
// }
console.log('⚠️ Service Worker disabled for testing');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);