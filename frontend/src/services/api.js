import { Capacitor } from '@capacitor/core';

export const CLOUD_SERVER_URL = 'https://sdb.shebatechnologybd.com/api';
export const LOCAL_LAN_SERVER_URL = 'http://192.168.1.23:3000/api';

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }
  } catch {
    // ignore
  }
  if (Boolean(window.androidBridge) || Boolean(window.Capacitor)) {
    return true;
  }
  if (window.location) {
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
      return true;
    }
    // Inside Capacitor Android/iOS WebView, hostname is localhost and port is empty
    if (window.location.hostname === 'localhost' && !window.location.port) {
      return true;
    }
  }
  return false;
};

const getApiBase = () => {
  let base = '';

  // 0. Custom Server URL from localStorage (allows Android app to connect to LAN IP or live domain)
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedServer = window.localStorage.getItem('sheba_pos_server_url');
    if (savedServer) {
      base = String(savedServer).trim();
    }
  }

  // 1. Explicit VITE_API_URL from environment
  if (!base && import.meta.env && import.meta.env.VITE_API_URL) {
    base = String(import.meta.env.VITE_API_URL).trim();
  }

  // 2. Native Capacitor / Android Detection: Always default to live cloud production server
  if (!base && isNativeApp()) {
    return CLOUD_SERVER_URL;
  }

  // 3. Web browser environment
  if (!base && typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    // Local Vite dev server ports -> connect directly to local backend port 3000
    if (['5173', '5174', '5175', '5176'].includes(port) || (port && port !== '3000' && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
      return `${protocol}//${hostname}:3000/api`;
    }
    // Production web hosts (Vercel, Render, or custom domains) fallback to relative /api
    return '/api';
  } else if (!base) {
    base = '/api';
  }

  // Remove trailing slashes
  base = base.replace(/\/+$/, '');

  // Ensure base ends with /api
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }

  return base;
};

const API_BASE = getApiBase();

// Helper to pre-warm Render server in background (wakes up free tier from sleep)
export const pingServer = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold start
    const res = await fetch(`${API_BASE}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    // If running in production on a public domain (e.g. sdb.shebatechnologybd.com or *.vercel.app),
    // NEVER attempt loopback / localhost requests (violates browser CORS & Private Network Access policy)
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      if (!isLocal) {
        if (import.meta.env?.VITE_FALLBACK_API_URL) {
          try {
            const res2 = await fetch(import.meta.env.VITE_FALLBACK_API_URL, { signal: AbortSignal.timeout(60000) });
            return res2.ok;
          } catch {
            return false;
          }
        }
        return false;
      }
    }

    // Only attempt localhost fallback if already in local dev environment
    try {
      const fallback = import.meta.env?.VITE_FALLBACK_API_URL || 'http://localhost:3000/api';
      const res2 = await fetch(fallback, { signal: AbortSignal.timeout(60000) });
      return res2.ok;
    } catch {
      return false;
    }
  }
};

export const getAuthHeaders = () => {
  const headers = {};
  if (typeof window !== 'undefined') {
    const token =
      window.localStorage?.getItem('sheba_auth_token') ||
      window.sessionStorage?.getItem('sheba_auth_token') ||
      window.localStorage?.getItem('token') ||
      '';
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }
  }
  return headers;
};

// Resilient fetch helper that handles mobile data, local fallback & proxy fallbacks with automatic auth headers
export const smartFetch = async (path, options = {}) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const primaryUrl = `${API_BASE}${cleanPath}`;
  
  const authHeaders = getAuthHeaders();
  const mergedOptions = {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  const executeFetchWithTimeout = async (url, opts, timeoutMs = 45000) => {
    if (opts.signal) {
      return fetch(url, opts);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };
  
  try {
    const res = await executeFetchWithTimeout(primaryUrl, mergedOptions, 45000);
    return res;
  } catch (err) {
    // If primary was LAN / local and failed (e.g. mobile disconnected from Wi-Fi or outside shop):
    // Fall back to Cloud Server
    if (!primaryUrl.includes('shebatechnologybd.com')) {
      try {
        console.warn(`[smartFetch] Primary endpoint (${primaryUrl}) failed. Auto fallback to Cloud Server (${CLOUD_SERVER_URL})...`);
        const cloudUrl = `${CLOUD_SERVER_URL}${cleanPath}`;
        const res2 = await executeFetchWithTimeout(cloudUrl, mergedOptions, 45000);
        if (res2) {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('sheba_pos_server_url', CLOUD_SERVER_URL);
          }
          return res2;
        }
      } catch {
        // Cloud fallback also failed, continue
      }
    } else {
      // Primary was Cloud and failed (e.g. Render sleeping, no external internet, shop Wi-Fi local mode):
      // Fall back to Local LAN Server
      try {
        console.warn(`[smartFetch] Cloud endpoint (${primaryUrl}) failed. Auto fallback to Local LAN Server (${LOCAL_LAN_SERVER_URL})...`);
        const lanUrl = `${LOCAL_LAN_SERVER_URL}${cleanPath}`;
        const res2 = await executeFetchWithTimeout(lanUrl, mergedOptions, 8000);
        if (res2) {
          return res2;
        }
      } catch {
        // Local LAN fallback failed
      }
    }

    // If running on Vercel and direct Render call failed, attempt fallback via relative proxy
    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
      try {
        const fallbackUrl = `/api${cleanPath}`;
        const res2 = await executeFetchWithTimeout(fallbackUrl, mergedOptions, 10000);
        return res2;
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

export const getCurrentServerUrl = () => API_BASE;

export const setCustomServerUrl = (url) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (!url) {
      window.localStorage.removeItem('sheba_pos_server_url');
    } else {
      let clean = String(url).trim().replace(/\/+$/, '');
      if (!clean.endsWith('/api')) clean = `${clean}/api`;
      window.localStorage.setItem('sheba_pos_server_url', clean);
    }
    window.location.reload();
  }
};

export default API_BASE;
