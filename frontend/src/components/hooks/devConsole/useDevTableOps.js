import { useState } from 'react';
import API, { getAuthHeaders } from '../../../services/api';

export default function useDevTableOps({ showMsg, fetchDevInfo, setLoading }) {
  const [forceTable, setForceTable] = useState('products');
  const [forceId, setForceId] = useState('');
  const [forceReason, setForceReason] = useState('Developer Emergency Fix');
  const [forceJsonFields, setForceJsonFields] = useState('{\n  "stock": 10\n}');
  const [forceActionLoading, setForceActionLoading] = useState(false);

  const handleKickDevice = async (deviceId, name) => {
    if (!window.confirm(`Kick device "${name}" and free up its slot?`)) return;
    try {
      const res = await fetch(`${API}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(`Device "${name}" logged out! Slot is now free.`);
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Failed to logout device', 'error');
      }
    } catch (err) {
      showMsg('Error logging out device', 'error');
    }
  };

  const handleForceDelete = async () => {
    if (!forceId) {
      alert('Please enter a Record ID');
      return;
    }
    if (
      !window.confirm(
        `⚠️ WARNING: Force delete record #${forceId} from "${forceTable}"? This bypasses standard lock chains and time-window restrictions.`
      )
    )
      return;

    try {
      setForceActionLoading(true);
      const res = await fetch(`${API}/dev/force-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          table_name: forceTable,
          record_id: Number(forceId),
          reason: forceReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
        setForceId('');
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Force delete failed', 'error');
      }
    } catch (err) {
      showMsg('Failed to execute force delete', 'error');
    } finally {
      setForceActionLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    if (!forceId) {
      alert('Please enter a Record ID');
      return;
    }
    let parsedFields;
    try {
      parsedFields = JSON.parse(forceJsonFields);
    } catch (err) {
      alert('Invalid JSON format in updates field!');
      return;
    }

    if (!window.confirm(`⚠️ Confirm force direct patch on "${forceTable}" #${forceId}?`))
      return;

    try {
      setForceActionLoading(true);
      const res = await fetch(`${API}/dev/force-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          table_name: forceTable,
          record_id: Number(forceId),
          fields: parsedFields,
          reason: forceReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Force update failed', 'error');
      }
    } catch (err) {
      showMsg('Failed to execute force update', 'error');
    } finally {
      setForceActionLoading(false);
    }
  };

  const handleMaintenance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/maintenance`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
      }
    } catch (err) {
      showMsg('Maintenance run failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanInventoryStock = async (mode) => {
    const confirmMsg =
      mode === 'wipe_all'
        ? '⚠️ WARNING: Are you sure you want to completely WIPE all test products and inventory stocks for a fresh launch?'
        : 'Are you sure you want to FORCE RESET all product inventory stock quantities to 0 across all warehouses?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/clean-inventory-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ mode, reason: 'Developer Console Force Clean' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message || 'Inventory stock force cleaned successfully!', 'success');
        fetchDevInfo();
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
      } else {
        showMsg(data.message || 'Failed to clean inventory stock', 'error');
      }
    } catch (err) {
      console.error(err);
      showMsg('Network error connecting to dev server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    forceTable,
    setForceTable,
    forceId,
    setForceId,
    forceReason,
    setForceReason,
    forceJsonFields,
    setForceJsonFields,
    forceActionLoading,
    handleKickDevice,
    handleForceDelete,
    handleForceUpdate,
    handleMaintenance,
    handleCleanInventoryStock,
  };
}
