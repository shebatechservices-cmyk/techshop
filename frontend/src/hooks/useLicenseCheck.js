import { useState, useEffect, useCallback } from 'react';
import { licenseAuthService } from '../services/licenseAuthService';

/**
 * useLicenseCheck Hook
 * 
 * Executes client-side self-license authentication, 15-day automated trial management,
 * and 48-hour offline grace-period fallback logic.
 * 
 * @returns {{
 *   isValid: boolean,
 *   isExpired: boolean,
 *   isBlocked: boolean,
 *   isTrial: boolean,
 *   trialDaysRemaining: number,
 *   trialEndDate: string|null,
 *   offlineGracePeriod: boolean,
 *   loading: boolean,
 *   licenseData: object|null,
 *   error: string|null,
 *   recheckLicense: () => Promise<void>
 * }}
 */
export default function useLicenseCheck() {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [hasCommercialLicense, setHasCommercialLicense] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [offlineGracePeriod, setOfflineGracePeriod] = useState(false);
  const [licenseData, setLicenseData] = useState(null);
  const [error, setError] = useState(null);

  const performCheck = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt validation with Vendor API / Backend / 15-Day Trial Engine
      const result = await licenseAuthService.verifyLicenseOnline();
      
      const isCommercial = result.hasCommercialLicense ?? (result.isValid && !result.is_trial);
      const isTrialMode = !isCommercial && (result.is_trial === true);

      setIsValid(result.isValid);
      setIsExpired(result.isExpired);
      setIsBlocked(result.isBlocked);
      setIsTrial(isTrialMode);
      setHasCommercialLicense(isCommercial);
      setTrialDaysRemaining(isTrialMode ? (result.trial_days_remaining !== undefined ? result.trial_days_remaining : 0) : 0);
      setTrialEndDate(isTrialMode ? (result.trial_end_date || null) : null);
      setOfflineGracePeriod(false);
      setLicenseData(result);
    } catch (err) {
      console.warn('[useLicenseCheck] Network verification failed. Falling back to offline grace evaluation:', err.message);

      // Offline Fallback Evaluation (48 Hours Grace Period or Cached Trial)
      const cached = licenseAuthService.getCachedToken();
      const graceResult = licenseAuthService.evaluateOfflineGrace(cached);

      const isCommercial = graceResult.hasCommercialLicense ?? (graceResult.isValid && !graceResult.is_trial);
      const isTrialMode = !isCommercial && (graceResult.is_trial === true);

      setIsValid(graceResult.isValid);
      setIsExpired(graceResult.isExpired);
      setIsBlocked(graceResult.isBlocked);
      setIsTrial(isTrialMode);
      setHasCommercialLicense(isCommercial);
      setTrialDaysRemaining(isTrialMode ? (graceResult.trial_days_remaining !== undefined ? graceResult.trial_days_remaining : 0) : 0);
      setTrialEndDate(isTrialMode ? (graceResult.trial_end_date || null) : null);
      setOfflineGracePeriod(graceResult.offlineGracePeriod || false);
      setLicenseData(graceResult);
      setError(graceResult.vendor_message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Background Heartbeat Telemetry: Sends POST to /api/license/heartbeat with license_key and mac_address every 5 minutes
  const triggerHeartbeat = useCallback(async () => {
    try {
      const hbResult = await licenseAuthService.sendHeartbeat();
      if (hbResult?.data) {
        const hbData = hbResult.data;
        if (hbData.killswitch || hbData.is_blocked || hbData.status === 'Blocked' || hbData.status === 'Suspended') {
          setIsBlocked(true);
          setIsValid(false);
        } else if (hbData.status === 'Expired' || hbData.is_expired) {
          setIsExpired(true);
          setIsValid(false);
        }
      }
    } catch (err) {
      console.warn('[useLicenseCheck] 5-Minute Heartbeat error:', err.message);
    }
  }, []);

  useEffect(() => {
    // Immediate startup heartbeat
    triggerHeartbeat();

    // Periodic 5-minute background heartbeat
    const heartbeatInterval = setInterval(() => {
      triggerHeartbeat();
    }, 5 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [triggerHeartbeat]);

  // 2. Automated License Validation on startup and every 5 minutes
  useEffect(() => {
    performCheck();

    const intervalId = setInterval(() => {
      performCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [performCheck]);

  return {
    isValid,
    isExpired,
    isBlocked,
    isTrial,
    hasCommercialLicense,
    trialDaysRemaining,
    trialEndDate,
    offlineGracePeriod,
    loading,
    licenseData,
    error,
    sendHeartbeat: triggerHeartbeat,
    recheckLicense: performCheck,
  };
}
