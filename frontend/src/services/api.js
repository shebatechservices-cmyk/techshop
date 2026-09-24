const getApiBase = () => {
  let base = '';
  // Vercel rewrites /api to Render. Keeping browser calls same-origin avoids
  // CORS failures even when a stale VITE_API_URL points at Render directly.
  if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
    return '/api';
  }
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    base = String(import.meta.env.VITE_API_URL).trim();
  } else if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (['5173', '5174', '5175', '5176'].includes(port) || (port && port !== '3000' && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
      return `${protocol}//${hostname}:3000/api`;
    }
    // In production web hosts (Vercel rewrite proxy, Render, or custom domains), use /api
    return '/api';
  } else {
    base = 'http://localhost:3000';
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
    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
      return false;
    }
    // If /api fails, attempt direct cloud endpoint
    try {
      const fallback = import.meta.env.VITE_FALLBACK_API_URL || 'http://localhost:3000/api';
      const res2 = await fetch(fallback, { signal: AbortSignal.timeout(60000) });
      return res2.ok;
    } catch {
      return false;
    }
  }
};

// Resilient fetch helper that handles Vercel -> Render cross-origin & proxy fallbacks
export const smartFetch = async (path, options = {}) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const primaryUrl = `${API_BASE}${cleanPath}`;
  
  try {
    const res = await fetch(primaryUrl, options);
    return res;
  } catch (err) {
    // If running on Vercel and direct Render call failed, attempt fallback via relative proxy
    if (typeof window !== 'undefined' && window.location?.hostname?.endsWith('.vercel.app')) {
      try {
        const fallbackUrl = `/api${cleanPath}`;
        const res2 = await fetch(fallbackUrl, options);
        return res2;
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

export default API_BASE;
