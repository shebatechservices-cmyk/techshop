import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import './style.css';

// Handle Vite dynamic import chunk preload failures when new deployments occur
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = sessionStorage.getItem('last_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 10000) {
    sessionStorage.setItem('last_chunk_reload', String(now));
    window.location.reload();
  }
});

// Suppress harmless browser/DevTools internal instrumentation errors and auto-recover on stale chunk imports
window.addEventListener(
  'error',
  (event) => {
    const msg = String(event?.message || event?.error?.message || '');
    if (
      msg.includes("reading 'startTime'") ||
      msg.includes('reportAllChanges') ||
      msg.includes('PerformanceObserver')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('error loading dynamically imported module')
    ) {
      event.preventDefault();
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
  },
  true
);

window.addEventListener(
  'unhandledrejection',
  (event) => {
    const msg = String(event?.reason?.message || event?.reason || '');
    if (
      msg.includes("reading 'startTime'") ||
      msg.includes('reportAllChanges') ||
      msg.includes('PerformanceObserver')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Loading chunk')
    ) {
      event.preventDefault();
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
  },
  true
);

// Add the authenticated session to every API call made by the existing views.
// This keeps individual screens from having to duplicate token plumbing.
const browserFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const urlStr = typeof input === 'string' ? input : (input?.url || '');
  const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
  const isApiCall = urlStr.startsWith('/api') || urlStr.includes('/api') || urlStr.includes(window.location.host + '/api') || urlStr.includes('localhost:3000/api') || urlStr.includes('sheba-technology.onrender.com/api');
  if (!token || !isApiCall || /\/security\/(login|signup|recovery-request)(?:$|[/?])/.test(urlStr)) {
    return browserFetch(input, init);
  }
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const response = await browserFetch(input, { ...init, headers });
  if (response.status === 401 && isApiCall && !urlStr.includes('/security/login')) {
    localStorage.removeItem('sheba_auth_user');
    localStorage.removeItem('sheba_auth_token');
    sessionStorage.removeItem('sheba_auth_user');
    sessionStorage.removeItem('sheba_auth_token');
    window.dispatchEvent(new CustomEvent('sheba:session_expired'));
  }
  return response;
};

import { BrowserRouter } from 'react-router-dom';

// Register Service Worker for PWA (Android / WebAPK / Offline shell) support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New update available for Sheba POS.');
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('[PWA] ServiceWorker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
