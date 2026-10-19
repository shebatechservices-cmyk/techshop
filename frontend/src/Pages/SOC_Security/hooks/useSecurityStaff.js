import { useState, useMemo } from 'react';
import { DEFAULT_USERS } from '../utils/securityConstants';
import { useSecurityStaffApprovals } from './staff/useSecurityStaffApprovals';
import { useSecurityStaffCrud } from './staff/useSecurityStaffCrud';

export function useSecurityStaff({ showToast, loadAllData }) {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  const approvals = useSecurityStaffApprovals({ showToast, loadAllData });
  const crud = useSecurityStaffCrud({ users, setUsers, showToast });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (staffRoleFilter !== 'all') {
        if ((u.role_name || '').toLowerCase() !== staffRoleFilter.toLowerCase()) return false;
      }
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        const matchName = String(u.name || '').toLowerCase().includes(q);
        const matchPhone = String(u.phone || '').toLowerCase().includes(q);
        const matchDev = String(u.device_id || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDev) return false;
      }
      return true;
    });
  }, [users, staffRoleFilter, staffSearch]);

  return {
    users,
    setUsers,
    staffSearch,
    setStaffSearch,
    staffRoleFilter,
    setStaffRoleFilter,
    filteredUsers,
    ...approvals,
    ...crud,
  };
}
