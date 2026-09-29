import { useLicenseSettingsState } from './useLicenseSettingsState';
import { licenseAuthService as defaultLicenseAuthService } from '../../services/licenseAuthService';

export function useLicenseManager({
  API,
  settings,
  setSettings,
  showToast,
  loadSettingsData,
  licenseAuthService = defaultLicenseAuthService,
}) {
  const licenseState = useLicenseSettingsState();
  const {
    licenseInfo,
    setLicenseInfo,
    redemptionCode,
    setRedemptionCode,
    redeeming,
    setRedeeming,
    syncingHeartbeat,
    setSyncingHeartbeat,
    redemptionResult,
    setRedemptionResult,
  } = licenseState;

  // Submit Redemption Code to /api/license/redeem
  const handleRedeemCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = (redemptionCode || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a valid License Key or Redemption Code', 'error');
      return;
    }

    // License Stacking Prompt: If current license has > 7 days remaining, prompt confirmation with date range
    const daysLeft =
      licenseInfo?.license_days_left !== undefined
        ? Number(licenseInfo.license_days_left)
        : licenseInfo?.license_expiry
        ? Math.ceil((new Date(licenseInfo.license_expiry) - Date.now()) / (24 * 60 * 60 * 1000))
        : 0;

    if (daysLeft > 7 && licenseInfo?.license_expiry) {
      const currentExpiryDate = new Date(licenseInfo.license_expiry).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const currentExpiryObj = new Date(licenseInfo.license_expiry);
      const projectedExtendedDate = new Date(
        currentExpiryObj.getTime() + 365 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const confirmMessage = `Your current license is valid until ${currentExpiryDate}. Applying this code will extend it to ${projectedExtendedDate}. Do you want to proceed?`;
      const proceed = window.confirm(confirmMessage);
      if (!proceed) {
        console.log('[useLicenseManager] User cancelled redemption stacking confirmation.');
        return;
      }
    }

    console.log('[useLicenseManager] Initiating Code Redemption with stacking:', cleanCode);

    try {
      setRedeeming(true);
      setRedemptionResult(null);

      const authService = licenseAuthService || defaultLicenseAuthService;
      const result = await authService.redeemCode(cleanCode);
      console.log('[useLicenseManager] Code Redemption Finished:', result);

      if (result.success) {
        const payloadData = result.data || {};
        const newExpiry = payloadData.license_expiry || payloadData.expiry_date || result.license_expiry;
        const newKey = payloadData.full_license_key || payloadData.license_key || cleanCode;
        const newDays = newExpiry
          ? Math.max(0, Math.ceil((new Date(newExpiry) - Date.now()) / (24 * 60 * 60 * 1000)))
          : 365;

        // Immediately update UI State with extended dates
        setLicenseInfo((prev) => ({
          ...(prev || {}),
          ...payloadData,
          status: 'active',
          full_license_key: newKey,
          license_key: newKey.length > 12 ? `${newKey.substring(0, 8)}...${newKey.slice(-4)}` : newKey,
          license_expiry: newExpiry || prev?.license_expiry,
          license_days_left: newDays,
          last_sync_at: new Date().toISOString(),
          vendor_message: result.message || 'Commercial License successfully extended',
        }));

        if (setSettings) {
          setSettings((prev) => ({
            ...prev,
            license_key: newKey,
            license_status: 'active',
          }));
        }

        setRedemptionResult({ success: true, message: result.message || 'License extended successfully!' });
        showToast(result.message || 'License extended successfully!', 'success');
        setRedemptionCode('');

        // Reload fresh settings & license cache in background
        if (loadSettingsData) loadSettingsData();

        // Broadcast event for top navigation bars or global layout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sheba:license_updated', { detail: payloadData }));
        }
      } else {
        const errorMsg = result.message || result.error || 'Failed to redeem voucher code.';
        setRedemptionResult({ success: false, message: errorMsg });
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('[useLicenseManager] handleRedeemCode exception:', err);
      const networkErrorMsg = `Network Error: ${err.message || 'Failed to connect to the licensing server.'}`;
      setRedemptionResult({ success: false, message: networkErrorMsg });
      showToast(networkErrorMsg, 'error');
    } finally {
      setRedeeming(false);
    }
  };

  // Trigger Heartbeat Sync with Central Vendor
  const handleTriggerHeartbeat = async () => {
    try {
      setSyncingHeartbeat(true);
      showToast('Contacting vendor licensing server...', 'info');
      const res = await fetch(`${API}/license/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('License status and vendor heartbeat synchronized successfully!');
        if (loadSettingsData) loadSettingsData();
      } else {
        showToast(data.message || 'Heartbeat sync failed', 'error');
      }
    } catch (err) {
      showToast('Vendor server connection error', 'error');
    } finally {
      setSyncingHeartbeat(false);
    }
  };

  return {
    ...licenseState,
    handleRedeemCode,
    handleTriggerHeartbeat,
  };
}

export default useLicenseManager;
