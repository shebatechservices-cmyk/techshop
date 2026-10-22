import API_BASE, {
  CLOUD_SERVER_URL,
  LOCAL_LAN_SERVER_URL,
  isNativeApp,
  getApiBase,
  getCurrentServerUrl,
  setCustomServerUrl,
} from './apiConfig';

export {
  CLOUD_SERVER_URL,
  LOCAL_LAN_SERVER_URL,
  isNativeApp,
  getApiBase,
  getCurrentServerUrl,
  setCustomServerUrl,
  API_BASE,
};



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

export const wrapResponseSafeJson = (response) => {
  if (!response || typeof response.json !== 'function') return response;
  const originalJson = response.json.bind(response);
  response.json = async () => {
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType.includes('text/html')) {
      return {
        success: false,
        error: `Server responded with HTML (${response.status}) instead of JSON`,
        isHtml: true,
        status: response.status,
      };
    }
    try {
      return await originalJson();
    } catch (parseErr) {
      if (String(parseErr?.message || '').includes('Unexpected token')) {
        return {
          success: false,
          error: 'Invalid JSON response from server',
          status: response.status,
        };
      }
      throw parseErr;
    }
  };
  return response;
};

// Resilient fetch helper that handles mobile data, local fallback & proxy fallbacks with automatic auth headers
export const smartFetch = async (path, options = {}) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const primaryUrl = `${API_BASE}${cleanPath}`;
  
  const authHeaders = getAuthHeaders();
  const mergedOptions = {
    ...options,
    headers: {
      Accept: 'application/json',
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
    return wrapResponseSafeJson(res);
  } catch (err) {
    // If primary was LAN / local and failed: fall back to Cloud Server
    if (!primaryUrl.includes('shebatechnologybd.com')) {
      try {
        console.warn(`[smartFetch] Primary endpoint (${primaryUrl}) failed. Auto fallback to Cloud Server (${CLOUD_SERVER_URL})...`);
        const cloudUrl = `${CLOUD_SERVER_URL}${cleanPath}`;
        const res2 = await executeFetchWithTimeout(cloudUrl, mergedOptions, 45000);
        if (res2) {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('sheba_pos_server_url', CLOUD_SERVER_URL);
          }
          return wrapResponseSafeJson(res2);
        }
      } catch {
        // Cloud fallback failed
      }
    } else {
      // Primary was Cloud and failed: fall back to Local LAN Server
      // Guard: Browsers block Mixed Content (HTTPS page cannot request HTTP LAN resource).
      // Only attempt HTTP LAN fallback if running in Native App (Capacitor) or loaded over HTTP.
      const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
      if (!isHttps || isNativeApp()) {
        try {
          console.warn(`[smartFetch] Cloud endpoint (${primaryUrl}) failed. Auto fallback to Local LAN Server (${LOCAL_LAN_SERVER_URL})...`);
          const lanUrl = `${LOCAL_LAN_SERVER_URL}${cleanPath}`;
          const res2 = await executeFetchWithTimeout(lanUrl, mergedOptions, 8000);
          if (res2) {
            return wrapResponseSafeJson(res2);
          }
        } catch {
          // Local LAN fallback failed
        }
      }
    }

    // If running on Vercel and direct Render call failed, attempt fallback via relative proxy
    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
      try {
        const fallbackUrl = `/api${cleanPath}`;
        const res2 = await executeFetchWithTimeout(fallbackUrl, mergedOptions, 10000);
        return wrapResponseSafeJson(res2);
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

export default API_BASE;
