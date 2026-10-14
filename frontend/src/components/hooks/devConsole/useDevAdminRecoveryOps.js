import { useState } from 'react';
import API, { getAuthHeaders } from '../../../services/api';

export default function useDevAdminRecoveryOps({ showMsg }) {
  const [adminCreds, setAdminCreds] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
  });
  const [adminRecoveryRequests, setAdminRecoveryRequests] = useState([]);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [resettingReqId, setResettingReqId] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [devNotes, setDevNotes] = useState('Approved and verified by Developer Console');

  const fetchAdminData = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const [adminRes, reqRes] = await Promise.all([
        fetch(`${API}/dev/admin-credentials`, { headers: authHeaders }).catch(() => null),
        fetch(`${API}/dev/admin-recovery-requests`, { headers: authHeaders }).catch(() => null),
      ]);
      if (adminRes && adminRes.ok) {
        const d = await adminRes.json();
        if (d.success && d.admin) {
          setAdminCreds({
            name: d.admin.name || '',
            email: d.admin.email || '',
            phone: d.admin.phone || '',
            password: d.admin.password_hash || '',
            is_active: d.admin.is_active !== false,
          });
        }
      }
      if (reqRes && reqRes.ok) {
        const d = await reqRes.json();
        if (d.success) setAdminRecoveryRequests(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAdminCreds = async (e) => {
    if (e) e.preventDefault();
    if (!adminCreds.name || (!adminCreds.email && !adminCreds.phone) || !adminCreds.password) {
      showMsg('Admin Name, Email/Phone, and Password are required!', 'error');
      return;
    }
    try {
      setAdminActionLoading(true);
      const res = await fetch(`${API}/dev/admin-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(adminCreds),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg('✓ App User Admin credentials saved & active in database!');
        fetchAdminData();
      } else {
        showMsg(d.message || 'Failed to save admin credentials', 'error');
      }
    } catch (err) {
      showMsg('Network error saving admin credentials', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleResolveAdminRecovery = async (requestId) => {
    if (!newAdminPassword) {
      showMsg('Please provide or generate a new password', 'error');
      return;
    }
    try {
      setAdminActionLoading(true);
      const res = await fetch(`${API}/dev/admin-recovery-resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          requestId,
          newPassword: newAdminPassword,
          developerNotes: devNotes,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg('✓ Admin password reset successful!');
        setResettingReqId(null);
        setNewAdminPassword('');
        fetchAdminData();
      } else {
        showMsg(d.message || 'Failed to reset admin password', 'error');
      }
    } catch (err) {
      showMsg('Network error resolving admin recovery', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  return {
    adminCreds,
    setAdminCreds,
    adminRecoveryRequests,
    adminActionLoading,
    resettingReqId,
    setResettingReqId,
    newAdminPassword,
    setNewAdminPassword,
    devNotes,
    setDevNotes,
    fetchAdminData,
    handleSaveAdminCreds,
    handleResolveAdminRecovery,
  };
}
