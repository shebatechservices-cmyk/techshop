import { DEFAULT_PROVIDER_PRESETS } from '../../../utils/settingsConstants';

export function useSmsProviderOps({
  API,
  showToast,
  loadSettingsData,
  setSmsProviders,
  setSmsBalance,
  providerModal,
  setProviderModal,
}) {
  const handleCheckLiveBalance = async (providerId = null) => {
    try {
      setSmsBalance((prev) => ({ ...prev, loading: true, error: null }));
      const token =
        localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const url = providerId
        ? `${API}/settings/sms/balance?provider_id=${providerId}`
        : `${API}/settings/sms/balance`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setSmsBalance({
          loading: false,
          balance: data.balance,
          raw: data.raw,
          error: null,
          checkedAt: new Date().toLocaleTimeString(),
        });
        showToast(`Balance: ${data.balance} (${data.provider || 'Gateway'})`);
      } else {
        setSmsBalance({
          loading: false,
          balance: null,
          raw: null,
          error: data?.message || 'Balance unavailable',
          checkedAt: new Date().toLocaleTimeString(),
        });
        showToast(data?.message || 'Balance check failed', 'error');
      }
    } catch (err) {
      setSmsBalance({
        loading: false,
        balance: null,
        raw: null,
        error: err.message,
        checkedAt: new Date().toLocaleTimeString(),
      });
      showToast('Network error prevented balance check', 'error');
    }
  };

  const handleSetActiveProvider = async (providerId) => {
    try {
      const token =
        localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const res = await fetch(`${API}/settings/sms/providers/${providerId}/activate`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(data.message || 'Active gateway updated successfully!');
        if (data.data) setSmsProviders(data.data);
      } else {
        showToast(data?.message || 'Failed to activate gateway', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const handleSaveProvider = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const token =
        localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const isEdit = providerModal.mode === 'edit';
      const url = isEdit
        ? `${API}/settings/sms/providers/${providerModal.data.id}`
        : `${API}/settings/sms/providers`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(providerModal.data),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(data.message || 'Gateway provider details saved successfully!');
        setProviderModal({ open: false, mode: 'create', data: {} });
        if (loadSettingsData) loadSettingsData();
      } else {
        showToast(data?.message || 'Failed to save provider', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm('Are you sure you want to delete this SMS provider configuration?')) return;
    try {
      const token =
        localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const res = await fetch(`${API}/settings/sms/providers/${providerId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(data.message || 'Provider removed successfully!');
        if (loadSettingsData) loadSettingsData();
      } else {
        showToast(data?.message || 'Failed to delete provider', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    }
  };

  const handleApplyProviderPreset = (presetCode) => {
    const sel = DEFAULT_PROVIDER_PRESETS[presetCode];
    if (sel) {
      setProviderModal((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          ...sel,
        },
      }));
    }
  };

  return {
    handleCheckLiveBalance,
    handleSetActiveProvider,
    handleSaveProvider,
    handleDeleteProvider,
    handleApplyProviderPreset,
  };
}
