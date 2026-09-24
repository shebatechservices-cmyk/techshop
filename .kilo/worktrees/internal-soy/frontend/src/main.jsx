import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './style.css';

// Add the authenticated session to every API call made by the existing views.
// This keeps individual screens from having to duplicate token plumbing.
const browserFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const urlStr = typeof input === 'string' ? input : input.url;
  const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
  const isApiCall = urlStr.startsWith('/api') || urlStr.includes(window.location.host + '/api') || urlStr.includes('localhost:3000/api') || urlStr.includes('sheba-technology.onrender.com/api');
  if (!token || !isApiCall || /\/security\/(login|signup|recovery-request)(?:$|[/?])/.test(urlStr)) {
    return browserFetch(input, init);
  }
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return browserFetch(input, { ...init, headers });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
