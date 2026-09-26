import { useState } from 'react';

export function useLicenseSettingsState() {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [syncingHeartbeat, setSyncingHeartbeat] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState(null);

  return {
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
  };
}
