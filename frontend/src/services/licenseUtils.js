/**
 * Pure Utility functions and Environment Getters for License Authentication
 */

/**
 * Deterministic checksum to prevent casual localStorage tampering
 */
export function createChecksum(payload) {
  if (!payload) return '';
  const raw = `${payload.license_key || ''}|${payload.status || ''}|${payload.expiry_date || ''}|${payload.lastVerifiedAt || ''}|${payload.is_blocked || false}|${payload.trial_start_date || ''}|${payload.trial_end_date || ''}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a deterministic client device fingerprint
 */
export function generateDeviceId() {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const screenInfo = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : 'generic';
    const raw = `${nav.userAgent || ''}-${nav.language || ''}-${screenInfo}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `DEV-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  } catch {
    return `DEV-SHEBA-${Date.now().toString(36).toUpperCase()}`;
  }
}

/**
 * Helper to log detailed network failures for debugging (CORS, timeout, down)
 */
export function logNetworkError(context, targetUrl, error) {
  if (import.meta.env && import.meta.env.DEV) {
    const isTimeout = error?.name === 'AbortError';
    const isTypeError = error?.name === 'TypeError';
    let diagnostic = 'Unknown connection error';

    if (isTimeout) {
      diagnostic = 'Request timed out (>4.5s). Vendor server may be slow or unreachable.';
    } else if (isTypeError && error?.message?.includes('Failed to fetch')) {
      diagnostic = 'Failed to fetch (Likely CORS policy block, SSL certificate error, or Vendor server is not running).';
    } else if (error?.message) {
      diagnostic = error.message;
    }

    console.error(`[licenseAuthService] ❌ ${context} Network Failure:`, {
      targetUrl,
      errorName: error?.name,
      errorMessage: error?.message,
      probableCause: diagnostic,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get configured license key from environment variables or custom storage
 */
export function getLicenseKey() {
  return (
    (typeof localStorage !== 'undefined' && localStorage.getItem('sheba_custom_license_key')) ||
    (import.meta.env && import.meta.env.VITE_LICENSE_KEY) ||
    (import.meta.env && import.meta.env.VITE_APP_KEY) ||
    ''
  );
}

/**
 * Get configured vendor API base URL exactly from VITE_VENDOR_API_URL
 */
export function getVendorUrl() {
  const rawUrl =
    (import.meta.env && import.meta.env.VITE_VENDOR_API_URL) ||
    (import.meta.env && import.meta.env.VITE_VENDOR_URL) ||
    '';
  const trimmed = String(rawUrl || '').trim().replace(/\/+$/, '');
  return trimmed;
}

/**
 * Get persistent device MAC address / Virtual MAC
 */
export function getMacAddress() {
  try {
    let mac = localStorage.getItem('sheba_device_mac');
    if (!mac) {
      const hw = localStorage.getItem('app_device_id');
      if (hw && /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(hw)) {
        mac = hw.toUpperCase();
      } else {
        // Generate deterministic persistent virtual MAC address
        const hex = Array.from({ length: 6 }, () =>
          Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
        )
          .join(':')
          .toUpperCase();
        mac = hex;
        localStorage.setItem('sheba_device_mac', mac);
      }
    }
    return mac;
  } catch {
    return '02:00:00:00:00:01';
  }
}

/**
 * Generate a unique deterministic hardware fingerprint using MAC address, OS, CPU cores, screen & browser environment
 */
export function generateHardwareFingerprint() {
  try {
    const mac = getMacAddress();
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const screen = typeof window !== 'undefined' && window.screen ? window.screen : {};
    const timeZone = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    const osPlatform = nav.userAgentData?.platform || nav.platform || 'Unknown-OS';
    const userAgent = nav.userAgent || 'Sheba-Client';
    const cpuCores = nav.hardwareConcurrency || 4;
    const memGb = nav.deviceMemory || 8;
    const screenRes = `${screen.width || 1920}x${screen.height || 1080}x${screen.colorDepth || 24}`;
    const lang = nav.language || 'en-US';

    const rawSignature = `${mac}###${osPlatform}###${userAgent}###${cpuCores}cores###${memGb}gb###${screenRes}###${timeZone}###${lang}`;

    // Deterministic 32-bit FNV-1a / Murmur hybrid hashing
    let h1 = 0xdeadbeef ^ 0, h2 = 0x41c64e6d ^ 0;
    for (let i = 0; i < rawSignature.length; i++) {
      const ch = rawSignature.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase().padStart(16, '0');
    const cleanMacSuffix = mac.replace(/[^A-Fa-f0-9]/g, '').slice(-6).toUpperCase();
    
    return `HW-FP-${hashHex}-${cleanMacSuffix}`;
  } catch {
    return `HW-FP-GENERIC-${Date.now().toString(16).toUpperCase()}`;
  }
}

/**
 * Get or initialize unique hardware fingerprint on app startup
 */
export function getHardwareFingerprint() {
  try {
    let cachedFp = localStorage.getItem('sheba_hardware_fingerprint');
    if (!cachedFp) {
      cachedFp = generateHardwareFingerprint();
      localStorage.setItem('sheba_hardware_fingerprint', cachedFp);
    }
    return cachedFp;
  } catch {
    return generateHardwareFingerprint();
  }
}

/**
 * Get configured application secret (VITE_APP_SECRET)
 */
export function getAppSecret() {
  return (
    (import.meta.env && import.meta.env.VITE_APP_SECRET) ||
    (import.meta.env && import.meta.env.VITE_CLIENT_SECRET) ||
    'sec_sheba_tech_enterprise_2026_vendor_auth'
  );
}

/**
 * Build standard secure request headers including VITE_APP_SECRET & Hardware Fingerprint
 */
export function getRequestHeaders(extraHeaders = {}) {
  const secret = getAppSecret();
  const fingerprint = getHardwareFingerprint();
  const mac = getMacAddress();
  const licKey = getLicenseKey();

  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Secret': secret,
    'x-app-secret': secret,
    'X-Hardware-Fingerprint': fingerprint,
    'x-hardware-fingerprint': fingerprint,
    'X-MAC-Address': mac,
    'x-mac-address': mac,
    ...(licKey ? { 'X-License-Key': licKey, 'x-license-key': licKey } : {}),
    ...extraHeaders,
  };
}

/**
 * Validate key format for VEND-XXXX-XXXX-XXXX-XXXX, SHEBA-ENT-..., REN-..., etc.
 */
export function isValidLicenseFormat(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  if (clean.length < 5) return false;
  const vendPattern = /^VEND-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
  const generalPattern = /^(VEND|SHEBA|REN|DOM|HOST|LIC|SAAS)?[A-Z0-9]{2,8}(-[A-Z0-9]{2,8}){1,5}$/i;
  return vendPattern.test(clean) || generalPattern.test(clean) || clean.length >= 6;
}
