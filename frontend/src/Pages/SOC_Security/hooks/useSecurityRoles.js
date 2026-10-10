import { useState, useEffect } from 'react';
import API from '../../../services/api';
import { DEFAULT_ROLES, DEFAULT_MODULES } from '../utils/securityConstants';

export function useSecurityRoles({ showToast, setError }) {
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [permissionsGrouped, setPermissionsGrouped] = useState(DEFAULT_MODULES);
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [activeRolePerms, setActiveRolePerms] = useState(DEFAULT_ROLES[0].permissions);
  const [savingPerms, setSavingPerms] = useState(false);

  // Update selected role perms when role changes
  useEffect(() => {
    const curRole = roles.find((r) => r.id === Number(selectedRoleId));
    if (curRole) {
      const perms = curRole.permissions || curRole.permission_codes || [];
      setActiveRolePerms(Array.isArray(perms) ? perms : []);
    }
  }, [selectedRoleId, roles]);

  // Handle Permission Checkbox Toggle
  const togglePermission = (permCode) => {
    setActiveRolePerms((prev) =>
      prev.includes(permCode) ? prev.filter((c) => c !== permCode) : [...prev, permCode]
    );
  };

  // Save Role Permissions
  const handleSaveRolePermissions = async () => {
    try {
      setSavingPerms(true);
      setError('');
      // Optimistic update
      setRoles((prev) =>
        prev.map((r) =>
          r.id === Number(selectedRoleId)
            ? { ...r, permissions: activeRolePerms, permission_codes: activeRolePerms }
            : r
        )
      );
      showToast('Role permissions updated and fortified successfully!');
      const res = await fetch(`${API}/roles/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          permission_codes: activeRolePerms,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.message || 'Failed to sync permissions with database.');
      }
    } catch (err) {
      setError(err.message || 'Error saving permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  return {
    roles,
    setRoles,
    permissionsGrouped,
    setPermissionsGrouped,
    selectedRoleId,
    setSelectedRoleId,
    activeRolePerms,
    setActiveRolePerms,
    savingPerms,
    setSavingPerms,
    togglePermission,
    handleSaveRolePermissions,
  };
}
