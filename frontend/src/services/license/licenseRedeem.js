import API_BASE from '../api';
import {
  getVendorUrl,
  getMacAddress,
  getHardwareFingerprint,
  getAppSecret,
  getRequestHeaders,
  isValidLicenseFormat,
  logNetworkError,
} from '../licenseUtils';

/**
 * Submit Redemption / License Key to Backend / Vendor Controller
 */
export async function redeemCode(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  const vendorUrl = getVendorUrl();
  const hwFingerprint = getHardwareFingerprint();
  const macAddress = getMacAddress();
  const appSecret = getAppSecret();

  if (import.meta.env && import.meta.env.DEV) {
    console.log('[licenseRedeem] 🎁 Outgoing Redeem Request:', {
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
      console.warn('[licenseRedeem] ⚠️ Key Format Validation Failed:', formatErr);
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
      console.log('[licenseRedeem] Attempting direct Vendor Redeem:', { targetUrl });
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
        console.log('[licenseRedeem] Vendor API Direct Redeem Response:', { status: res.status, data });
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
      } else if (res.status === 400 && data?.error === 'Code already used') {
        return {
          success: false,
          message: data.error,
          error: data.error,
        };
      } else {
        // If 404 or other vendor status, fall through to Application Backend proxy
        console.warn(`[licenseRedeem] Direct Vendor API returned status ${res.status}. Falling back to Backend proxy.`);
      }
    } catch (err) {
      logNetworkError('Redeem (Direct Vendor API)', targetUrl, err);
    }
  }

  // 2. Local Backend Licensing Route (/api/license/redeem)
  const localTargetUrl = `${API_BASE}/license/redeem`;
  if (import.meta.env && import.meta.env.DEV) {
    console.log('[licenseRedeem] Attempting Local Backend Redeem Proxy:', { localTargetUrl });
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
      console.log('[licenseRedeem] Local Backend Redeem Response:', { status: res.status, data });
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
      console.warn('[licenseRedeem] Server Rejected Code:', serverErrorMessage);
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
}
