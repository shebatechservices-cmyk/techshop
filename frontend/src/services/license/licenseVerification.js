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
import {
  getOrCreateTrialRecord,
  evaluateTrial,
  formatVerificationResponse,
} from '../licenseStorage';
import { notifyVendorTrialActivation } from './licenseHeartbeat';

/**
 * Securely verify license online with Vendor API / local backend proxy
 */
export async function verifyLicenseOnline() {
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
      console.log('[licenseVerification] 🔍 Verifying License against Vendor API:', {
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
        console.log('[licenseVerification] ✅ Vendor API License Verify Response:', { status: res.status, data });
      }

      if (res.ok) {
        return formatVerificationResponse(data);
      } else if (res.status === 402 || res.status === 403) {
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
    console.log('[licenseVerification] 🔍 Checking License against Application Backend:', { localTargetUrl });
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
      console.log('[licenseVerification] ✅ Application Backend License Status Response:', { status: res.status, data });
    }

    if (res.ok) {
      if (data.status === 'active' && data.full_license_key && !data.is_trial) {
        try {
          localStorage.setItem('sheba_custom_license_key', data.full_license_key);
          localStorage.removeItem('sheba_trial_license_v1');
        } catch (_) {}
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
    notifyVendorTrialActivation(trialRecord);
    return evaluateTrial(trialRecord);
  }

  // If online checks failed and a commercial key was configured, throw to trigger offline grace period check
  throw lastError || new Error('Licensing server unreachable');
}
