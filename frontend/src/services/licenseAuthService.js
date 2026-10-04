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
import {
  notifyVendorTrialActivation,
  sendHeartbeat,
} from './license/licenseHeartbeat';
import {
  verifyLicenseOnline,
} from './license/licenseVerification';
import {
  redeemCode,
} from './license/licenseRedeem';

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
  logNetworkError,

  // Storage & Evaluation forwards
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

  // Core Service Operations
  notifyVendorTrialActivation,
  sendHeartbeat,
  verifyLicenseOnline,
  redeemCode,
};

// Named exports for modular access
export {
  notifyVendorTrialActivation,
  sendHeartbeat,
  verifyLicenseOnline,
  redeemCode,
};

export default licenseAuthService;

// Auto-initialize hardware fingerprint on app startup
try {
  if (typeof window !== 'undefined') {
    getHardwareFingerprint();
  }
} catch (_) {}
