import API_BASE from './api';
import {
  getLicenseKey,
  getVendorUrl,
  getMacAddress,
  generateHardwareFingerprint,
  getHardwareFingerprint,
  getAppSecret,
  getRequestHeaders,
  isValidLicenseFormat,
  logNetworkError,
} from './licenseUtils';
import {
  STORAGE_KEY,
  TRIAL_STORAGE_KEY,
  GRACE_PERIOD_MS,
  TRIAL_DURATION_MS,
  getOrCreateTrialRecord,
  evaluateTrial,
  saveCachedToken,
  getCachedToken,
  formatVerificationResponse,
  evaluateOfflineGrace,
} from './licenseStorage';

export const licenseAuthService = {
  // Utility & Environment forwards
  getLicenseKey,
  getVendorUrl,
  getMacAddress,
  generateHardwareFingerprint,
  getHardwareFingerprint,
  getAppSecret,
  getRequestHeaders,
  isValidLicenseFormat,

  // Storage & Evaluation forwards
  getOrCreateTrialRecord,
  evaluateTrial,
  saveCachedToken,
  getCachedToken,
  formatVerificationResponse,
  evaluateOfflineGrace,

  /**
   * Silently notify Vendor Central Controller of new trial
   */
  async notifyVendorTrialActivation(trialRecord) {
    const vendorUrl = getVendorUrl();
    const hwFingerprint = getHardwareFingerprint();
    const macAddress = getMacAddress();
    const appSecret = getAppSecret();

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

    const headers = getRequestHeaders();

    // 1. Notify Vendor API
    if (vendorUrl) {
      const targetUrl = `${vendorUrl}/api/license/activate-trial`;
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] 🚀 Outgoing Trial Activation to Vendor:', { targetUrl, payload, headers });
      }
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
        if (import.meta.env && import.meta.env.DEV) {
          console.log('[licenseAuthService] ✅ Vendor Trial Activation Response:', { status: res.status, data });
        }
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
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] ✅ Local Backend Trial Activation Response:', { status: res.status, data });
      }
    } catch (err) {
      logNetworkError('Trial Activation (Local Backend)', localTargetUrl, err);
    }
  },

  /**
   * Send background live heartbeat telemetry with license_key, hardware fingerprint and app secret
   * POST /api/license/heartbeat
   */
  async sendHeartbeat(extraParams = {}) {
    const configuredKey = getLicenseKey();
    const macAddress = getMacAddress();
    const hwFingerprint = getHardwareFingerprint();
    const appSecret = getAppSecret();
    const vendorUrl = getVendorUrl();

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

    const headers = getRequestHeaders();

    if (import.meta.env && import.meta.env.DEV) {
      console.log('[licenseAuthService] 📡 Dispatching 5-Min Heartbeat Telemetry:', {
        vendorUrl: vendorUrl || 'Local Proxy Only',
        license_key: configuredKey ? `${configuredKey.substring(0, 8)}...` : 'NONE',
        mac_address: macAddress,
        hardware_fingerprint: hwFingerprint,
        timestamp: new Date().toISOString(),
      });
    }

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
        if (import.meta.env && import.meta.env.DEV) {
          console.log('[licenseAuthService] ✅ Direct Vendor Heartbeat Response:', { status: res.status, data });
        }
        if (res.ok) {
          return { success: true, source: 'vendor', data };
        }
      } catch (err) {
        logNetworkError('Heartbeat (Direct Vendor API)', targetUrl, err);
      }
    }

    // 2. Application Backend Licensing Route (/api/license/heartbeat)
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
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] ✅ Application Backend Heartbeat Response:', { status: res.status, data });
      }
      if (res.ok) {
        return { success: true, source: 'local', data };
      }
    } catch (err) {
      logNetworkError('Heartbeat (Application Backend Proxy)', localTargetUrl, err);
    }

    return { success: false, error: 'Licensing servers unreachable' };
  },

  /**
   * Securely verify license online with Vendor API / local backend proxy
   */
  async verifyLicenseOnline() {
    const configuredKey = getLicenseKey();
    const vendorUrl = getVendorUrl();
    const macAddress = getMacAddress();
    const hwFingerprint = getHardwareFingerprint();
    const appSecret = getAppSecret();

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

    const headers = getRequestHeaders();
    let lastError = null;

    // 1. Direct Vendor API Call (if VITE_VENDOR_API_URL and key are present)
    if (vendorUrl && configuredKey) {
      const targetUrl = `${vendorUrl}/api/license/verify`;
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] 🔍 Verifying License against Vendor API:', {
          targetUrl,
          license_key: configuredKey,
          hardware_fingerprint: hwFingerprint,
        });
      }

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
        if (import.meta.env && import.meta.env.DEV) {
          console.log('[licenseAuthService] ✅ Vendor API License Verify Response:', { status: res.status, data });
        }

        if (res.ok) {
          return formatVerificationResponse(data);
        } else if (res.status === 402 || res.status === 403 || res.status === 404) {
          return formatVerificationResponse({
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

    // 2. Application Backend Licensing Route (/api/license/status)
    const localTargetUrl = `${API_BASE}/license/status`;
    if (import.meta.env && import.meta.env.DEV) {
      console.log('[licenseAuthService] 🔍 Checking License against Application Backend:', { localTargetUrl });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(localTargetUrl, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] ✅ Application Backend License Status Response:', { status: res.status, data });
      }

      if (res.ok) {
        if (data.status === 'active' && data.full_license_key && !data.is_trial) {
          return formatVerificationResponse(data);
        } else if (data.status === 'expired' || data.status === 'suspended') {
          return formatVerificationResponse(data);
        }
      }
    } catch (err) {
      logNetworkError('License Status Check (Application Backend)', localTargetUrl, err);
      lastError = err;
    }

    // 3. If NO commercial license is active on backend or environment, evaluate 15-Day Free Trial
    if (!configuredKey) {
      const trialRecord = getOrCreateTrialRecord();
      this.notifyVendorTrialActivation(trialRecord);
      return evaluateTrial(trialRecord);
    }

    // If online checks failed and a commercial key was configured, throw to trigger offline grace period check
    throw lastError || new Error('Licensing server unreachable');
  },

  /**
   * Submit Redemption / License Key to Backend / Vendor Controller
   */
  async redeemCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const vendorUrl = getVendorUrl();
    const hwFingerprint = getHardwareFingerprint();
    const macAddress = getMacAddress();
    const appSecret = getAppSecret();

    if (import.meta.env && import.meta.env.DEV) {
      console.log('[licenseAuthService] 🎁 Outgoing Redeem Request:', {
        code: cleanCode,
        vendorUrl: vendorUrl || 'Local Proxy',
        hardware_fingerprint: hwFingerprint,
        isValidFormat: isValidLicenseFormat(cleanCode),
        timestamp: new Date().toISOString(),
      });
    }

    if (!isValidLicenseFormat(cleanCode)) {
      const formatErr = {
        success: false,
        message: 'Invalid key format. Expected format: VEND-XXXX-XXXX-XXXX-XXXX or SHEBA-ENT-XXXX-PRO',
        error: 'Invalid Key Format',
      };
      if (import.meta.env && import.meta.env.DEV) {
        console.warn('[licenseAuthService] ⚠️ Key Format Validation Failed:', formatErr);
      }
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

    const headers = getRequestHeaders(cleanCode ? { 'X-License-Key': cleanCode, 'x-license-key': cleanCode } : {});

    // 1. Direct Vendor API Call if VITE_VENDOR_API_URL is configured
    if (vendorUrl) {
      const targetUrl = `${vendorUrl}/api/vendor/redeem`;
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] Attempting direct Vendor Redeem:', { targetUrl });
      }
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
        if (import.meta.env && import.meta.env.DEV) {
          console.log('[licenseAuthService] Vendor API Direct Redeem Response:', { status: res.status, data });
        }

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
    if (import.meta.env && import.meta.env.DEV) {
      console.log('[licenseAuthService] Attempting Local Backend Redeem Proxy:', { localTargetUrl });
    }

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
      if (import.meta.env && import.meta.env.DEV) {
        console.log('[licenseAuthService] Local Backend Redeem Response:', { status: res.status, data });
      }

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

      if (import.meta.env && import.meta.env.DEV) {
        console.warn('[licenseAuthService] Server Rejected Code:', serverErrorMessage);
      }
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
    getHardwareFingerprint();
  }
} catch (_) {}
