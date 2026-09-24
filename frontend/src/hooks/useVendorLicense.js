import { useState, useEffect, useCallback } from 'react';
import API_BASE from '../services/api';

/**
 * useVendorLicense Hook
 * 
 * Manages real-time software licensing and vendor app subscription validation.
 * Connects to the local ERP licensing endpoint / Vendor Central Controller.
 * 
 * @returns {{
 *   isLicenseValid: boolean,
 *   loading: boolean,
 *   licenseDetails: object|null,
 *   checkLicense: () => Promise<void>
 * }}
 */
export default function useVendorLicense() {
  const [loading, setLoading] = useState(true);
  const [licenseDetails, setLicenseDetails] = useState(null);
  const [isLicenseValid, setIsLicenseValid] = useState(true);

  const checkLicense = useCallback(async () => {
    try {
      setLoading(true);
      
      // Query local licensing status endpoint with fallback headers
      const res = await fetch(`${API_BASE}/license/status`, {
        headers: {
          'Accept': 'application/json',
          'X-App-Key': import.meta.env.VITE_APP_KEY || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLicenseDetails(data);
        
        // Determine validity based on server flags and expiration status
        const isBlocked = data.is_blocked === true;
        const isStatusValid = !['expired', 'suspended', 'revoked', 'invalid'].includes(data.status?.toLowerCase());
        const valid = !isBlocked && isStatusValid;

        setIsLicenseValid(valid);
      } else {
        // In case of non-200, check if response contains error details
        const errData = await res.json().catch(() => null);
        if (errData && errData.is_blocked) {
          setLicenseDetails(errData);
          setIsLicenseValid(false);
        }
      }
    } catch (err) {
      console.warn('[useVendorLicense] Warning: Failed to connect to licensing server:', err.message);
      // Retain offline grace cached state if previously verified
    } finally {
      setLoading(false);
    }
  }, []);

  // Check license status on initial mount and set up periodic sync
  useEffect(() => {
    checkLicense();

    // Periodic heartbeat sync every 10 minutes
    const intervalId = setInterval(() => {
      checkLicense();
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [checkLicense]);

  return {
    isLicenseValid,
    loading,
    licenseDetails,
    checkLicense,
  };
}
