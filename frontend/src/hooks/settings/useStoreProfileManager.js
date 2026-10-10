import { useState, useEffect } from 'react';
import defaultAPI from '../../services/api';
import { DEFAULT_SETTINGS } from '../../utils/settingsConstants';

export function useStoreProfileManager({
  API: apiProp,
  domainSetters = {},
} = {}) {
  const API = apiProp || defaultAPI;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // System Stats
  const [stats, setStats] = useState({
    totalProducts: 45,
    totalSales: 128,
    totalCustomers: 84,
    dbSize: '14.8 MB',
    uptimeFormatted: '48d 14h 22m',
    nodeVersion: 'v24.20.0',
    memoryUsage: '42 MB'
  });

  // Toast notification helper
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const getSetter = (key) => {
    if (domainSetters && typeof domainSetters === 'object') {
      if (domainSetters.current) {
        return domainSetters.current[key];
      }
      return domainSetters[key];
    }
    return undefined;
  };

  // Load Settings, License & Triggers Data
  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const [resSettings, resLogs, resTriggers, resSmsLogs, resFiles, resLicense, resProviders] = await Promise.all([
        fetch(`${API}/settings`).catch(() => null),
        fetch(`${API}/settings/backup-logs`, { headers: authHeaders }).catch(() => null),
        fetch(`${API}/settings/sms/triggers`).catch(() => null),
        fetch(`${API}/settings/sms/logs`, { headers: authHeaders }).catch(() => null),
        fetch(`${API}/settings/backup-files`, { headers: authHeaders }).catch(() => null),
        fetch(`${API}/license/status`).catch(() => null),
        fetch(`${API}/settings/sms/providers`, { headers: authHeaders }).catch(() => null)
      ]);

      if (resSettings && resSettings.ok) {
        const json = await resSettings.json();
        if (json.data) setSettings(prev => ({ ...prev, ...json.data }));
        if (json.stats) setStats(prev => ({ ...prev, ...json.stats }));
      }
      if (resLogs && resLogs.ok) {
        const jsonLogs = await resLogs.json();
        if (jsonLogs.data?.length > 0) {
          const setter = getSetter('setBackupLogs');
          if (setter) setter(jsonLogs.data);
        }
      }
      if (resTriggers && resTriggers.ok) {
        const jsonTrig = await resTriggers.json();
        if (jsonTrig.data?.length > 0) {
          const setter = getSetter('setSmsTriggers');
          if (setter) setter(jsonTrig.data);
        }
      }
      if (resSmsLogs && resSmsLogs.ok) {
        const jsonSmsLogs = await resSmsLogs.json();
        if (jsonSmsLogs.data) {
          const setter = getSetter('setSmsLogs');
          if (setter) setter(jsonSmsLogs.data);
        }
      }
      if (resProviders && resProviders.ok) {
        const jsonP = await resProviders.json();
        if (jsonP.data) {
          const setter = getSetter('setSmsProviders');
          if (setter) setter(jsonP.data);
        }
      }
      if (resFiles && resFiles.ok) {
        const jsonFiles = await resFiles.json();
        if (jsonFiles.files) {
          const setter = getSetter('setBackupFiles');
          if (setter) setter(jsonFiles.files);
        }
      }
      if (resLicense && resLicense.ok) {
        const jsonLic = await resLicense.json();
        if (jsonLic.success) {
          const setter = getSetter('setLicenseInfo');
          if (setter) setter(jsonLic);
          setSettings(prev => ({
            ...prev,
            license_key: jsonLic.full_license_key || jsonLic.license_key || prev.license_key,
            license_status: jsonLic.status || prev.license_status,
            domain_expiry: jsonLic.domain_expiry || prev.domain_expiry,
            client_app_id: jsonLic.client_app_id || prev.client_app_id
          }));
        }
      }
    } catch (err) {
      console.warn('Load settings failed, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Save All Settings
  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const res = await fetch(`${API}/settings/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast('All settings saved successfully!');
        if (data.data) setSettings(prev => ({ ...prev, ...data.data }));
        window.dispatchEvent(new CustomEvent('shop-info-updated'));
      } else {
        showToast(data?.message || 'Failed to save settings', res.ok ? 'success' : 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving settings to server', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset Shop to Dummy Template
  const handleResetDummyShop = async () => {
    if (!window.confirm('Reset store profile to demo template? You can edit and save your actual store details at any time.')) return;
    try {
      setSaving(true);
      const res = await fetch(`${API}/settings/reset-dummy-shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showToast(data.message || 'Store profile reset to demo defaults!');
        if (data.data) setSettings(prev => ({ ...prev, ...data.data }));
      } else {
        showToast(data?.message || 'Failed to reset store profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server connection error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reusable Image File Upload Helper
  const uploadImageFile = async (file) => {
    if (!file) return null;
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API}/images/logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) {
      return data.url;
    }
    throw new Error(data?.error || data?.message || 'Logo upload failed.');
  };

  // Generic Image Upload Handler
  const handleGenericImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG/PNG/WEBP).');
      e.target.value = '';
      return;
    }
    try {
      setSaving(true);
      const url = await uploadImageFile(file);
      if (url) {
        setSettings(prev => ({ ...prev, [field]: url }));
        showToast('Image uploaded successfully!');
        window.dispatchEvent(new CustomEvent('shop-info-updated'));
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Image upload failed.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  // Upload Shop Logo
  const handleLogoUpload = async (e) => {
    handleGenericImageUpload(e, 'logo_url');
  };

  return {
    settings,
    setSettings,
    stats,
    setStats,
    loading,
    setLoading,
    saving,
    setSaving,
    toast,
    setToast,
    showToast,
    loadSettingsData,
    handleSaveSettings,
    handleResetDummyShop,
    uploadImageFile,
    handleGenericImageUpload,
    handleLogoUpload,
  };
}

export default useStoreProfileManager;
