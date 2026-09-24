import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './style.css';

// Suppress harmless browser/DevTools internal instrumentation errors (e.g. Chromium Soft Navigation Heuristics / requestIdleCallback 'startTime' bugs in VM scripts)
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
