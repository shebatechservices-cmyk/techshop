import API_BASE from '../api';
import {
  getLicenseKey,
  getVendorUrl,
  getMacAddress,
  getHardwareFingerprint,
  getAppSecret,
  getRequestHeaders,
  logNetworkError,
} from '../licenseUtils';

/**
 * Silently notify Vendor Central Controller of new trial
 */
export async function notifyVendorTrialActivation(trialRecord) {
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
      console.log('[licenseHeartbeat] 🚀 Outgoing Trial Activation to Vendor:', { targetUrl, payload, headers });
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
        console.log('[licenseHeartbeat] ✅ Vendor Trial Activation Response:', { status: res.status, data });
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
      console.log('[licenseHeartbeat] ✅ Local Backend Trial Activation Response:', { status: res.status, data });
    }
  } catch (err) {
    logNetworkError('Trial Activation (Local Backend)', localTargetUrl, err);
  }
}

/**
 * Send background live heartbeat telemetry with license_key, hardware fingerprint and app secret
 * POST /api/license/heartbeat
 */
export async function sendHeartbeat(extraParams = {}) {
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
    console.log('[licenseHeartbeat] 📡 Dispatching 5-Min Heartbeat Telemetry:', {
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
        console.log('[licenseHeartbeat] ✅ Direct Vendor Heartbeat Response:', { status: res.status, data });
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
      console.log('[licenseHeartbeat] ✅ Application Backend Heartbeat Response:', { status: res.status, data });
    }
    if (res.ok) {
      return { success: true, source: 'local', data };
    }
  } catch (err) {
    logNetworkError('Heartbeat (Application Backend Proxy)', localTargetUrl, err);
  }

  return { success: false, error: 'Licensing servers unreachable' };
}
