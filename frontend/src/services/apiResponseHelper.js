import API_BASE from './apiConfig';

export const pingServer = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${API_BASE}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      if (!isLocal) {
        if (import.meta.env?.VITE_FALLBACK_API_URL) {
          try {
            const res2 = await fetch(import.meta.env.VITE_FALLBACK_API_URL, {
              signal: AbortSignal.timeout(60000),
            });
            return res2.ok;
          } catch {
            return false;
          }
        }
        return false;
      }
    }

    try {
      const fallback = import.meta.env?.VITE_FALLBACK_API_URL || 'http://localhost:3000/api';
      const res2 = await fetch(fallback, { signal: AbortSignal.timeout(60000) });
      return res2.ok;
    } catch {
      return false;
    }
  }
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
