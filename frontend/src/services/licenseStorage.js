import { createChecksum, generateDeviceId, getLicenseKey } from './licenseUtils';

export const STORAGE_KEY = 'sheba_license_auth_token_v1';
export const TRIAL_STORAGE_KEY = 'sheba_trial_license_v1';
export const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 Hours
export const TRIAL_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 Days

/**
 * Get or initialize the 15-day Trial Record
 */
export function getOrCreateTrialRecord() {
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

  return newTrial;
}

/**
 * Evaluate remaining trial days and active status
 */
export function evaluateTrial(trialRecord) {
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
}

/**
 * Save verified license payload to localStorage with integrity checksum
 */
export function saveCachedToken(payload) {
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
}

/**
 * Retrieve cached license token from localStorage
 */
export function getCachedToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.checksum !== createChecksum(parsed)) {
      if (import.meta.env && import.meta.env.DEV) {
        console.warn('[licenseAuthService] Tampered license cache detected');
      }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Format and normalize server response
 */
export function formatVerificationResponse(data) {
  const status = (data.status || 'Active').toLowerCase();
  const isBlocked =
    data.is_blocked === true ||
    data.killswitch === true ||
    status === 'blocked' ||
    status === 'suspended';
  const isExpired = status === 'expired';
  const isValid = !isBlocked && !isExpired && (data.authorized !== false) && status !== 'invalid';
  const licKey = data.full_license_key || data.license_key || getLicenseKey();
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

  saveCachedToken(formatted);
  return formatted;
}

/**
 * Evaluate offline fallback logic (48 Hours Grace Period or Trial)
 */
export function evaluateOfflineGrace(cached) {
  // If no commercial cached token exists or token is marked trial, evaluate the 15-day trial record
  if (!cached || cached.is_trial) {
    const trialRecord = getOrCreateTrialRecord();
    return evaluateTrial(trialRecord);
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
}
