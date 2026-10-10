import { useState } from 'react';
import API from '../../../services/api';
import { DEFAULT_DEVICES } from '../utils/securityConstants';

export function useSecurityDevices({ showToast }) {
  const [devices, setDevices] = useState(DEFAULT_DEVICES);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [strictDeviceMode, setStrictDeviceMode] = useState(true);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    device_name: '',
    device_type: 'desktop',
    user_id: '',
  });

  // Device Authorize / Revoke
  const handleToggleDeviceAuth = async (device) => {
    try {
      const newAuth = !device.is_authorized;
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, is_authorized: newAuth } : d))
      );
      showToast(`Device ${device.device_name} is now ${newAuth ? '✓ AUTHORIZED' : '🚫 REVOKED'}`);
      await fetch(`${API}/security/devices/${device.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_authorized: newAuth }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete / Deregister Device
  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Deregister and remove this device from hardware fleet?')) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
    showToast('Device deregistered from fleet.');
    try {
      await fetch(`${API}/security/devices/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Create Device
  const handleCreateDevice = async (e) => {
    e.preventDefault();
    try {
      const createdDev = {
        id: Date.now(),
        ...newDevice,
        browser_info: 'Manual Entry Terminal',
        is_authorized: true,
        last_active: 'Just now',
      };
      setDevices((prev) => [createdDev, ...prev]);
      showToast(`Device ${newDevice.device_name} registered and authorized!`);
      setIsAddDeviceOpen(false);
      const payload = { ...newDevice };
      setNewDevice({ device_id: '', device_name: '', device_type: 'desktop', user_id: '' });

      await fetch(`${API}/security/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    devices,
    setDevices,
    isAddDeviceOpen,
    setIsAddDeviceOpen,
    strictDeviceMode,
    setStrictDeviceMode,
    newDevice,
    setNewDevice,
    handleToggleDeviceAuth,
    handleDeleteDevice,
    handleCreateDevice,
  };
}
