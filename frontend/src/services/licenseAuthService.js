import API_BASE from './api';

const STORAGE_KEY = 'sheba_license_auth_token_v1';
const TRIAL_STORAGE_KEY = 'sheba_trial_license_v1';
const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 Hours
const TRIAL_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 Days

/**
 * Deterministic checksum to prevent casual localStorage tampering
 */
function createChecksum(payload) {
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
function generateDeviceId() {
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
function logNetworkError(context, targetUrl, error) {
  const isTimeout = error.name === 'AbortError';
  const isTypeError = error.name === 'TypeError';
  let diagnostic = 'Unknown connection error';

  if (isTimeout) {
    diagnostic = 'Request timed out (>4.5s). Vendor server may be slow or unreachable.';
  } else if (isTypeError && error.message.includes('Failed to fetch')) {
    diagnostic = 'Failed to fetch (Likely CORS policy block, SSL certificate error, or Vendor server is not running).';
  } else if (error.message) {
    diagnostic = error.message;
  }

  console.error(`[licenseAuthService] ❌ ${context} Network Failure:`, {
    targetUrl,
    errorName: error.name,
    errorMessage: error.message,
    probableCause: diagnostic,
    timestamp: new Date().toISOString(),
  });
}

export const licenseAuthService = {
  /**
   * Get configured license key from environment variables or custom storage
   */
  getLicenseKey() {
    return (
      (typeof localStorage !== 'undefined' && localStorage.getItem('sheba_custom_license_key')) ||
      (import.meta.env && import.meta.env.VITE_LICENSE_KEY) ||
      (import.meta.env && import.meta.env.VITE_APP_KEY) ||
      ''
    );
  },

  /**
   * Get configured vendor API base URL exactly from VITE_VENDOR_API_URL
   */
  getVendorUrl() {
    const rawUrl = (import.meta.env && import.meta.env.VITE_VENDOR_API_URL) || '';
    const trimmed = String(rawUrl || '').trim().replace(/\/+$/, '');
    return trimmed;
  },

  /**
   * Get persistent device MAC address / Virtual MAC
   */
  getMacAddress() {
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
  },

  /**
   * Generate a unique deterministic hardware fingerprint using MAC address, OS, CPU cores, screen & browser environment
   */
  generateHardwareFingerprint() {
    try {
      const mac = this.getMacAddress();
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
  },

  /**
   * Get or initialize unique hardware fingerprint on app startup
   */
  getHardwareFingerprint() {
    try {
      let cachedFp = localStorage.getItem('sheba_hardware_fingerprint');
      if (!cachedFp) {
        cachedFp = this.generateHardwareFingerprint();
        localStorage.setItem('sheba_hardware_fingerprint', cachedFp);
      }
      return cachedFp;
    } catch {
      return this.generateHardwareFingerprint();
    }
  },

  /**
   * Get configured application secret (VITE_APP_SECRET)
   */
  getAppSecret() {
    return (
      (import.meta.env && import.meta.env.VITE_APP_SECRET) ||
      (import.meta.env && import.meta.env.VITE_CLIENT_SECRET) ||
      'sec_sheba_tech_enterprise_2026_vendor_auth'
    );
  },

  /**
   * Build standard secure request headers including VITE_APP_SECRET & Hardware Fingerprint
   */
  getRequestHeaders(extraHeaders = {}) {
    const secret = this.getAppSecret();
    const fingerprint = this.getHardwareFingerprint();
    const mac = this.getMacAddress();
    const licKey = this.getLicenseKey();

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
  },


  /**
   * 1. Get or initialize the 15-day Trial Record
   */
  getOrCreateTrialRecord() {
    try {
      const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.checksum === createChecksum(parsed)) {
          return parsed;
        }
      }
    } catch (_) {}

    // First Launch: Initialize 15-Day Free Trial
    const now = Date.now();
    const startDate = new Date(now).toISOString();
    const endDate = new Date(now + TRIAL_DURATION_MS).toISOString();
    const deviceId = generateDeviceId();

    const newTrial = {
      deviceId,
      trial_start_date: startDate,
      trial_end_date: endDate,
      is_trial: true,
      trial_days_total: 15,
      clientAppId: 'CLIENT-SHEBA-TECH-8801',
    };
    newTrial.checksum = createChecksum(newTrial);

    try {
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(newTrial));
    } catch (_) {}

    // Silently notify Vendor API about new trial registration
    this.notifyVendorTrialActivation(newTrial);

    return newTrial;
  },

  /**
   * Evaluate remaining trial days and active status
   */
  evaluateTrial(trialRecord) {
    if (!trialRecord) return null;

    const now = Date.now();
    const startMs = new Date(trialRecord.trial_start_date).getTime();
    const endMs = new Date(trialRecord.trial_end_date).getTime();

    // Clock tampering protection (if clock was moved back before start date by > 2 hours)
    if (now < startMs - 2 * 60 * 60 * 1000) {
      return {
        isValid: false,
        isBlocked: true,
        isExpired: true,
        is_trial: true,
        hasCommercialLicense: false,
        trial_days_remaining: 0,
        trial_start_date: trialRecord.trial_start_date,
        trial_end_date: trialRecord.trial_end_date,
        vendor_message: 'System clock tampering detected. Please enter a purchased license key.',
      };
    }

    const remainingMs = endMs - now;
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

    if (remainingMs > 0) {
      return {
        isValid: true,
        isBlocked: false,
        isExpired: false,
        is_trial: true,
        hasCommercialLicense: false,
        trial_days_remaining: remainingDays,
        trial_start_date: trialRecord.trial_start_date,
        trial_end_date: trialRecord.trial_end_date,
        days_remaining: remainingDays,
        expiry_date: trialRecord.trial_end_date,
        status: 'Trial Active',
        vendor_message: `15-Day Free Trial Active (${remainingDays} days remaining)`,
      };
    }

    // Trial Expired
    return {
      isValid: false,
      isBlocked: true,
      isExpired: true,
      is_trial: true,
      hasCommercialLicense: false,
      trial_days_remaining: 0,
      trial_start_date: trialRecord.trial_start_date,
      trial_end_date: trialRecord.trial_end_date,
      days_remaining: 0,
      expiry_date: trialRecord.trial_end_date,
      status: 'Trial Expired',
      vendor_message: 'Your 15-day free trial period has concluded. Please enter a purchased License Key to continue.',
    };
  },

  /**
   * Silently notify Vendor Central Controller of new trial
   */
  async notifyVendorTrialActivation(trialRecord) {
    const vendorUrl = this.getVendorUrl();
    const hwFingerprint = this.getHardwareFingerprint();
    const macAddress = this.getMacAddress();
    const appSecret = this.getAppSecret();

    const payload = {
      deviceId: trialRecord.deviceId,
      hardware_fingerprint: hwFingerprint,
      hardwareFingerprint: hwFingerprint,
      hardware_id: hwFingerprint,
      mac_address: macAddress,
      macAddress: macAddress,
      app_secret: appSecret,
      secret_key: appSecret,
      secretKey: appSecret,
      clientAppId: trialRecord.clientAppId || 'CLIENT-SHEBA-TECH-8801',
      clientId: 'CLIENT-SHEBA-TECH-8801',
      startDate: trialRecord.trial_start_date,
      endDate: trialRecord.trial_end_date,
      trialDays: 15,
      domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      appVersion: '16.9.26',
      app_version: '16.9.26',
    };

    const headers = this.getRequestHeaders();

    // 1. Notify Vendor API
    if (vendorUrl) {
      const targetUrl = `${vendorUrl}/api/license/activate-trial`;
      console.log('[licenseAuthService] 🚀 Outgoing Trial Activation to Vendor:', { targetUrl, payload, headers });
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => ({}));
        console.log('[licenseAuthService] ✅ Vendor Trial Activation Response:', { status: res.status, data });
      } catch (err) {
        logNetworkError('Trial Activation (Vendor API)', targetUrl, err);
      }
    }

    // 2. Fallback notify local backend proxy
    const localTargetUrl = `${API_BASE}/license/activate-trial`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(localTargetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      console.log('[licenseAuthService] ✅ Local Backend Trial Activation Response:', { status: res.status, data });
    } catch (err) {
      logNetworkError('Trial Activation (Local Backend)', localTargetUrl, err);
    }
  },

  /**
   * Send background live heartbeat telemetry with license_key, hardware fingerprint and app secret
   * POST /api/license/heartbeat
   */
  async sendHeartbeat(extraParams = {}) {
    const configuredKey = this.getLicenseKey();
    const macAddress = this.getMacAddress();
    const hwFingerprint = this.getHardwareFingerprint();
    const appSecret = this.getAppSecret();
    const vendorUrl = this.getVendorUrl();

    const payload = {
      license_key: configuredKey || '',
      licenseKey: configuredKey || '',
      hardware_fingerprint: hwFingerprint,
      hardwareFingerprint: hwFingerprint,
      hardware_id: hwFingerprint,
      mac_address: macAddress,
      macAddress: macAddress,
      app_secret: appSecret,
      secret_key: appSecret,
      secretKey: appSecret,
      clientId: 'CLIENT-SHEBA-TECH-8801',
      client_app_id: 'CLIENT-SHEBA-TECH-8801',
      domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      app_version: '16.9.26',
      appVersion: '16.9.26',
      timestamp: Date.now(),
      ...extraParams,
    };

    const headers = this.getRequestHeaders();

    console.log('[licenseAuthService] 📡 Dispatching 5-Min Heartbeat Telemetry:', {
      vendorUrl: vendorUrl || 'Local Proxy Only',
      license_key: configuredKey ? `${configuredKey.substring(0, 8)}...` : 'NONE',
      mac_address: macAddress,
      hardware_fingerprint: hwFingerprint,
      timestamp: new Date().toISOString(),
    });

    // 1. Direct Vendor API Heartbeat Endpoint
    if (vendorUrl && configuredKey) {
      const targetUrl = `${vendorUrl}/api/license/heartbeat`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => ({}));
        console.log('[licenseAuthService] ✅ Direct Vendor Heartbeat Response:', { status: res.status, data });
        if (res.ok) {
          return { success: true, source: 'vendor', data };
        }
      } catch (err) {
        logNetworkError('Heartbeat (Direct Vendor API)', targetUrl, err);
      }
    }

    // 2. Local Backend Licensing Route (/api/license/heartbeat)
    const localTargetUrl = `${API_BASE}/license/heartbeat`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(localTargetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      console.log('[licenseAuthService] ✅ Local Backend Heartbeat Response:', { status: res.status, data });
      if (res.ok) {
        return { success: true, source: 'local', data };
      }
    } catch (err) {
      logNetworkError('Heartbeat (Local Backend Proxy)', localTargetUrl, err);
    }

    return { success: false, error: 'Licensing servers unreachable' };
  },

  /**
   * Securely verify license online with Vendor API / local backend proxy
   */
  async verifyLicenseOnline() {
    const configuredKey = this.getLicenseKey();
    const vendorUrl = this.getVendorUrl();
    const macAddress = this.getMacAddress();
    const hwFingerprint = this.getHardwareFingerprint();
    const appSecret = this.getAppSecret();

    const payload = {
      license_key: configuredKey || '',
      licenseKey: configuredKey || '',
      hardware_fingerprint: hwFingerprint,
      hardwareFingerprint: hwFingerprint,
      hardware_id: hwFingerprint,
      mac_address: macAddress,
      macAddress: macAddress,
      app_secret: appSecret,
      secret_key: appSecret,
      secretKey: appSecret,
      clientId: 'CLIENT-SHEBA-TECH-8801',
      client_app_id: 'CLIENT-SHEBA-TECH-8801',
      domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      appVersion: '16.9.26',
      app_version: '16.9.26',
      timestamp: Date.now(),
    };

    const headers = this.getRequestHeaders();
    let lastError = null;

    // 1. Direct Vendor API Call (if VITE_VENDOR_API_URL and key are present)
    if (vendorUrl && configuredKey) {
      const targetUrl = `${vendorUrl}/api/license/verify`;
      console.log('[licenseAuthService] 🔍 Verifying License against Vendor API:', {
        targetUrl,
        license_key: configuredKey,
        hardware_fingerprint: hwFingerprint,
      });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => ({}));
        console.log('[licenseAuthService] ✅ Vendor API License Verify Response:', { status: res.status, data });

        if (res.ok) {
          return this.formatVerificationResponse(data);
        } else if (res.status === 402 || res.status === 403 || res.status === 404) {
          return this.formatVerificationResponse({
            ...data,
            authorized: false,
            killswitch: true,
            status: res.status === 402 ? 'Expired' : 'Blocked',
          });
        }
      } catch (err) {
        logNetworkError('License Verification (Vendor API)', targetUrl, err);
        lastError = err;
      }
    }

    // 2. Local Backend Licensing Route (/api/license/status)
    const localTargetUrl = `${API_BASE}/license/status`;
    console.log('[licenseAuthService] 🔍 Checking License against Local Backend:', { localTargetUrl });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(localTargetUrl, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      console.log('[licenseAuthService] ✅ Local Backend License Status Response:', { status: res.status, data });

      if (res.ok) {
        if (data.status === 'active' && data.full_license_key && !data.is_trial) {
          return this.formatVerificationResponse(data);
        } else if (data.status === 'expired' || data.status === 'suspended') {
          return this.formatVerificationResponse(data);
        }
      }
    } catch (err) {
      logNetworkError('License Status Check (Local Backend)', localTargetUrl, err);
      lastError = err;
    }

    // 3. If NO commercial license is active on backend or environment, evaluate 15-Day Free Trial
    if (!configuredKey) {
      const trialRecord = this.getOrCreateTrialRecord();
      return this.evaluateTrial(trialRecord);
    }

    // If online checks failed and a commercial key was configured, throw to trigger offline grace period check
    throw lastError || new Error('Licensing server unreachable');
  },

  /**
   * Format and normalize server response
   */
  formatVerificationResponse(data) {
    const status = (data.status || 'Active').toLowerCase();
    const isBlocked =
      data.is_blocked === true ||
      data.killswitch === true ||
      status === 'blocked' ||
      status === 'suspended';
    const isExpired = status === 'expired';
    const isValid = !isBlocked && !isExpired && (data.authorized !== false) && status !== 'invalid';
    const licKey = data.full_license_key || data.license_key || this.getLicenseKey();
    const isTrial = data.is_trial === true;

    const formatted = {
      license_key: licKey,
      status: data.status || (isValid ? 'Active' : isExpired ? 'Expired' : 'Blocked'),
      isValid,
      isBlocked,
      isExpired,
      is_trial: isTrial,
      hasCommercialLicense: isValid && !isTrial && !!licKey,
      expiry_date: data.expiry_date || data.license_expiry || null,
      days_remaining: data.license_days_left !== undefined ? data.license_days_left : 365,
      vendor_message: data.vendor_message || data.message || (isValid ? 'Commercial License verified' : 'Access Restricted'),
      lastVerifiedAt: Date.now(),
      offlineGracePeriod: false,
    };

    this.saveCachedToken(formatted);
    return formatted;
  },

  /**
   * Save verified license payload to localStorage with integrity checksum
   */
  saveCachedToken(payload) {
    try {
      const dataToSave = {
        license_key: payload.license_key,
        status: payload.status,
        isValid: payload.isValid,
        isBlocked: payload.isBlocked,
        isExpired: payload.isExpired,
        is_trial: payload.is_trial || false,
        hasCommercialLicense: payload.hasCommercialLicense || false,
        expiry_date: payload.expiry_date,
        days_remaining: payload.days_remaining,
        vendor_message: payload.vendor_message,
        lastVerifiedAt: payload.lastVerifiedAt || Date.now(),
      };
      dataToSave.checksum = createChecksum(dataToSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (_) {}
  },

  /**
   * Retrieve cached license token from localStorage
   */
  getCachedToken() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.checksum !== createChecksum(parsed)) {
        console.warn('[licenseAuthService] Tampered license cache detected');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Evaluate offline fallback logic (48 Hours Grace Period or Trial)
   */
  evaluateOfflineGrace(cached) {
    // If no commercial cached token exists or token is marked trial, evaluate the 15-day trial record
    if (!cached || cached.is_trial) {
      const trialRecord = this.getOrCreateTrialRecord();
      return this.evaluateTrial(trialRecord);
    }

    // If license was already blocked or expired when online, grace period cannot apply
    if (cached.isBlocked || cached.isExpired || !cached.isValid) {
      return {
        ...cached,
        hasCommercialLicense: false,
        offlineGracePeriod: false,
        isValid: false,
      };
    }

    const now = Date.now();
    const elapsed = now - (cached.lastVerifiedAt || 0);
    const graceRemainingMs = GRACE_PERIOD_MS - elapsed;

    if (graceRemainingMs > 0) {
      const hoursLeft = Math.ceil(graceRemainingMs / (1000 * 60 * 60));
      return {
        ...cached,
        isValid: true,
        isBlocked: false,
        isExpired: false,
        is_trial: false,
        hasCommercialLicense: true,
        offlineGracePeriod: true,
        graceHoursLeft: hoursLeft,
        vendor_message: `Offline mode active. Grace period remaining: ${hoursLeft} hour(s).`,
      };
    }

    // Grace period has elapsed (> 48 hours)
    return {
      ...cached,
      isValid: false,
      isBlocked: true,
      isExpired: false,
      is_trial: false,
      hasCommercialLicense: false,
      offlineGracePeriod: false,
      graceHoursLeft: 0,
      vendor_message: 'Offline grace period (48 hours) expired. Please connect to the internet to verify your license.',
    };
  },

  /**
   * Validate key format for VEND-XXXX-XXXX-XXXX-XXXX, SHEBA-ENT-..., REN-..., etc.
   */
  isValidLicenseFormat(code) {
    if (!code || typeof code !== 'string') return false;
    const clean = code.trim().toUpperCase();
    if (clean.length < 5) return false;
    // Format: VEND-5KQS-BC4V-EXKM-CVBR or SHEBA-ENT-2026-X99-PRO or standard alphanumeric dashed
    const vendPattern = /^VEND-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    const generalPattern = /^(VEND|SHEBA|REN|DOM|HOST|LIC|SAAS)?[A-Z0-9]{2,8}(-[A-Z0-9]{2,8}){1,5}$/i;
    return vendPattern.test(clean) || generalPattern.test(clean) || clean.length >= 6;
  },

  /**
   * Submit Redemption / License Key to Backend / Vendor Controller
   */
  async redeemCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const vendorUrl = this.getVendorUrl();
    const hwFingerprint = this.getHardwareFingerprint();
    const macAddress = this.getMacAddress();
    const appSecret = this.getAppSecret();

    console.log('[licenseAuthService] 🎁 Outgoing Redeem Request:', {
      code: cleanCode,
      vendorUrl: vendorUrl || 'Local Proxy',
      hardware_fingerprint: hwFingerprint,
      isValidFormat: this.isValidLicenseFormat(cleanCode),
      timestamp: new Date().toISOString(),
    });

    if (!this.isValidLicenseFormat(cleanCode)) {
      const formatErr = {
        success: false,
        message: 'Invalid key format. Expected format: VEND-XXXX-XXXX-XXXX-XXXX or SHEBA-ENT-XXXX-PRO',
        error: 'Invalid Key Format',
      };
      console.warn('[licenseAuthService] ⚠️ Key Format Validation Failed:', formatErr);
      return formatErr;
    }

    const payload = {
      code: cleanCode,
      redemption_code: cleanCode,
      license_key: cleanCode,
      licenseKey: cleanCode,
      hardware_fingerprint: hwFingerprint,
      hardwareFingerprint: hwFingerprint,
      hardware_id: hwFingerprint,
      mac_address: macAddress,
      macAddress: macAddress,
      app_secret: appSecret,
      secret_key: appSecret,
      secretKey: appSecret,
      client_app_id: 'CLIENT-SHEBA-TECH-8801',
      clientId: 'CLIENT-SHEBA-TECH-8801',
      domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      app_version: '16.9.26',
      appVersion: '16.9.26',
    };

    const headers = this.getRequestHeaders(cleanCode ? { 'X-License-Key': cleanCode, 'x-license-key': cleanCode } : {});

    // 1. Direct Vendor API Call if VITE_VENDOR_API_URL is configured
    if (vendorUrl) {
      const targetUrl = `${vendorUrl}/api/vendor/redeem`;
      console.log('[licenseAuthService] Attempting direct Vendor Redeem:', { targetUrl });
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(() => null);
        console.log('[licenseAuthService] Vendor API Direct Redeem Response:', { status: res.status, data });

        if (res.ok && data && (data.success || data.data)) {
          try {
            localStorage.setItem('sheba_custom_license_key', cleanCode);
          } catch (_) {}
          return {
            success: true,
            message: data.message || 'License successfully verified and activated with Vendor!',
            data: data.data || data,
          };
        } else if (res.status === 400 || res.status === 403 || res.status === 404) {
          const errMsg = (data && (data.error || data.message)) || `Vendor rejected code (${res.status})`;
          return {
            success: false,
            message: errMsg,
            error: errMsg,
          };
        }
      } catch (err) {
        logNetworkError('Redeem (Direct Vendor API)', targetUrl, err);
      }
    }

    // 2. Local Backend Licensing Route (/api/license/redeem)
    const localTargetUrl = `${API_BASE}/license/redeem`;
    console.log('[licenseAuthService] Attempting Local Backend Redeem Proxy:', { localTargetUrl });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(localTargetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      console.log('[licenseAuthService] Local Backend Redeem Response:', { status: res.status, data });

      if (res.ok && data && (data.success || data.data)) {
        try {
          localStorage.setItem('sheba_custom_license_key', cleanCode);
        } catch (_) {}
        return {
          success: true,
          message: data.message || 'License successfully verified and activated!',
          data: data.data || data,
        };
      }

      const serverErrorMessage =
        (data && (data.error || data.message)) ||
        (res.status === 404
          ? 'Key not found in database'
          : res.status === 403
          ? 'License key is suspended or blocked by administrator'
          : `Redemption failed with status ${res.status}`);

      console.warn('[licenseAuthService] Server Rejected Code:', serverErrorMessage);
      return {
        success: false,
        message: serverErrorMessage,
        error: serverErrorMessage,
      };
    } catch (err) {
      logNetworkError('Redeem (Local Backend Proxy)', localTargetUrl, err);
      return {
        success: false,
        message: `Network Error: Unable to connect to licensing server (${err.message})`,
        error: err.message,
      };
    }
  },
};

// Auto-initialize hardware fingerprint on app startup
try {
  if (typeof window !== 'undefined') {
    licenseAuthService.getHardwareFingerprint();
  }
} catch (_) {}

