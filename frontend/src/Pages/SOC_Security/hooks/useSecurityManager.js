import { useState, useEffect, useCallback } from 'react';
import API from '../../../services/api';
import { useSecurityAuditLogs } from './useSecurityAuditLogs';
import { useSecurityStaff } from './useSecurityStaff';
import { useSecurityRoles } from './useSecurityRoles';
import { useSecurityDevices } from './useSecurityDevices';
import { useSecurityIpRules } from './useSecurityIpRules';

export function useSecurityManager() {
  const [overview, setOverview] = useState({
    healthScore: 96,
    totalUsers: 6,
    activeUsers: 6,
    lockedUsers: 0,
    technicians: 2,
    totalDevices: 4,
    authorizedDevices: 4,
    totalBlockedAttempts: 161,
    recentCriticals: 2,
    ipRulesCount: 4,
    perimeterStatus: 'ACTIVE_SHIELD',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showToast = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }, []);

  // Sub-hooks
  const auditLogs = useSecurityAuditLogs();
  const rolesOps = useSecurityRoles({ showToast, setError });
  const devicesOps = useSecurityDevices({ showToast });
  const ipOps = useSecurityIpRules({ showToast });

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [
        overviewRes,
        logsRes,
        usersRes,
        rolesRes,
        permsRes,
        devicesRes,
        ipRes,
        recoveryRes,
        pendingStaffRes,
      ] = await Promise.all([
        fetch(`${API}/security/overview`).catch(() => null),
        fetch(`${API}/security/logs`).catch(() => null),
        fetch(`${API}/security/users`).catch(() => null),
        fetch(`${API}/roles`).catch(() => null),
        fetch(`${API}/roles/permissions`).catch(() => null),
        fetch(`${API}/security/devices`).catch(() => null),
        fetch(`${API}/security/ip-rules`).catch(() => null),
        fetch(`${API}/security/recovery-requests`).catch(() => null),
        fetch(`${API}/security/pending-staff`).catch(() => null),
      ]);

      if (overviewRes && overviewRes.ok) {
        const d = await overviewRes.json();
        if (d.data) setOverview(d.data);
      }
      if (logsRes && logsRes.ok) {
        const d = await logsRes.json();
        if (d.data && d.data.length > 0) auditLogs.setLogs(d.data);
      }
      if (usersRes && usersRes.ok) {
        const d = await usersRes.json();
        if (d.data && d.data.length > 0) staffOps.setUsers(d.data);
      }
      if (rolesRes && rolesRes.ok) {
        const d = await rolesRes.json();
        const rList = d.data || [];
        if (rList.length > 0) {
          rolesOps.setRoles(rList);
          rolesOps.setSelectedRoleId((prev) => {
            if (!prev) {
              rolesOps.setActiveRolePerms(rList[0].permissions || rList[0].permission_codes || []);
              return rList[0].id;
            }
            return prev;
          });
        }
      }
      if (permsRes && permsRes.ok) {
        const d = await permsRes.json();
        if (d.data && d.data.length > 0) rolesOps.setPermissionsGrouped(d.data);
      }
      if (devicesRes && devicesRes.ok) {
        const d = await devicesRes.json();
        if (d.data && d.data.length > 0) devicesOps.setDevices(d.data);
      }
      if (ipRes && ipRes.ok) {
        const d = await ipRes.json();
        if (d.data && d.data.length > 0) ipOps.setIpRules(d.data);
      }
      if (recoveryRes && recoveryRes.ok) {
        const d = await recoveryRes.json();
        if (d.success) staffOps.setStaffRecoveryRequests(d.data || []);
      }
      if (pendingStaffRes && pendingStaffRes.ok) {
        const d = await pendingStaffRes.json();
        if (d.success) staffOps.setPendingStaffList(d.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const staffOps = useSecurityStaff({ showToast, loadAllData });

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    overview,
    setOverview,
    loading,
    setLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    showToast,
    loadAllData,

    // Sub-hooks spread directly
    ...auditLogs,
    ...staffOps,
    ...rolesOps,
    ...devicesOps,
    ...ipOps,
  };
}

export default useSecurityManager;
