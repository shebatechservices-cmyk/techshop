import API_BASE, {
  CLOUD_SERVER_URL,
  LOCAL_LAN_SERVER_URL,
  isNativeApp,
  getApiBase,
  getCurrentServerUrl,
  setCustomServerUrl,
} from './apiConfig';
import { pingServer, wrapResponseSafeJson } from './apiResponseHelper';

export {
  CLOUD_SERVER_URL,
  LOCAL_LAN_SERVER_URL,
  isNativeApp,
  getApiBase,
  getCurrentServerUrl,
  setCustomServerUrl,
  API_BASE,
  pingServer,
  wrapResponseSafeJson,
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
    if (window.sessionStorage?.getItem('sheba_dev_session') === 'unlocked_true') {
      headers['x-dev-secret'] =
        window.localStorage?.getItem('sheba_dev_pass_hash') ||
        '5aa0a287d8aea91e3c49a2f999d6d3409e08e678b61eb48c66c062b793166448';
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
    if (!primaryUrl.includes('shebatechnologybd.com')) {
      try {
        console.warn(`[smartFetch] Primary failed. Fallback to Cloud (${CLOUD_SERVER_URL})...`);
        const cloudUrl = `${CLOUD_SERVER_URL}${cleanPath}`;
        const res2 = await executeFetchWithTimeout(cloudUrl, mergedOptions, 45000);
        if (res2) {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('sheba_pos_server_url', CLOUD_SERVER_URL);
          }
          return wrapResponseSafeJson(res2);
        }
      } catch {}
    } else {
      const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
      if (!isHttps || isNativeApp()) {
        try {
          console.warn(`[smartFetch] Cloud failed. Fallback to LAN (${LOCAL_LAN_SERVER_URL})...`);
          const lanUrl = `${LOCAL_LAN_SERVER_URL}${cleanPath}`;
          const res2 = await executeFetchWithTimeout(lanUrl, mergedOptions, 8000);
          if (res2) {
            return wrapResponseSafeJson(res2);
          }
        } catch {}
      }
    }

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
