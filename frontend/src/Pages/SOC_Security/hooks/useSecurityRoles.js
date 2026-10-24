import { useState, useEffect } from 'react';
import API from '../../../services/api';
import { DEFAULT_ROLES, DEFAULT_MODULES } from '../utils/securityConstants';

export function useSecurityRoles({ showToast, setError }) {
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [permissionsGrouped, setPermissionsGrouped] = useState(DEFAULT_MODULES);
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [activeRolePerms, setActiveRolePerms] = useState(DEFAULT_ROLES[0].permissions);
  const [savingPerms, setSavingPerms] = useState(false);

  // Initialize roles map: { [roleId]: string[] }
  const [rolesPermMap, setRolesPermMap] = useState(() => {
    const map = {};
    DEFAULT_ROLES.forEach((r) => {
      map[r.id] = r.permissions || r.permission_codes || [];
    });
    return map;
  });

  // Fetch live roles and permissions from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMatrixData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetch(`${API}/roles`),
          fetch(`${API}/roles/permissions`),
        ]);
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();

        if (isMounted) {
          if (rolesData.success && Array.isArray(rolesData.data) && rolesData.data.length > 0) {
            setRoles(rolesData.data);
            const map = {};
            rolesData.data.forEach((r) => {
              const perms = r.permissions || r.permission_codes || [];
              map[r.id] = Array.isArray(perms) ? perms : [];
            });
            setRolesPermMap(map);
          }
          if (permsData.success && Array.isArray(permsData.data) && permsData.data.length > 0) {
            setPermissionsGrouped(permsData.data);
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_ROLES and DEFAULT_MODULES
      }
    };
    fetchMatrixData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync activeRolePerms when selectedRoleId or rolesPermMap changes
  useEffect(() => {
    const perms = rolesPermMap[selectedRoleId] || [];
    setActiveRolePerms(perms);
  }, [selectedRoleId, rolesPermMap]);

  // Toggle permission for a specific role in the matrix
  const toggleRolePermission = (roleId, permCode) => {
    if (Number(roleId) === 1 && permCode === 'edit_role_permissions') {
      // Super admin must retain role permissions editor
      return;
    }
    setRolesPermMap((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(permCode)
        ? current.filter((c) => c !== permCode)
        : [...current, permCode];
      return { ...prev, [roleId]: updated };
    });
  };

  // Toggle single permission for current selected role (legacy compatibility)
  const togglePermission = (permCode) => {
    toggleRolePermission(selectedRoleId, permCode);
  };

  // Reset all roles or a specific role to standard defaults
  const handleResetToDefaults = (targetRoleId = null) => {
    setRolesPermMap((prev) => {
      const updated = { ...prev };
      DEFAULT_ROLES.forEach((def) => {
        if (!targetRoleId || Number(def.id) === Number(targetRoleId)) {
          updated[def.id] = [...def.permissions];
        }
      });
      return updated;
    });
    showToast(targetRoleId ? 'Role reset to standard defaults' : 'All roles reset to standard defaults');
  };

  // Save all role permissions matrix in one call
  const handleSaveAllRolePermissions = async () => {
    try {
      setSavingPerms(true);
      setError('');

      const payload = Object.entries(rolesPermMap).map(([role_id, permission_codes]) => ({
        role_id: Number(role_id),
        permission_codes,
      }));

      const res = await fetch(`${API}/roles/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Failed to sync permissions with database.');
      }
      showToast('All role permissions updated and fortified successfully!');
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
    rolesPermMap,
    toggleRolePermission,
    togglePermission,
    handleResetToDefaults,
    handleSaveAllRolePermissions,
    handleSaveRolePermissions: handleSaveAllRolePermissions,
    savingPerms,
  };
}
