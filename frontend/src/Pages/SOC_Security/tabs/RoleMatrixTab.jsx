import React, { useState } from 'react';
import RoleMatrixHeaderBar from './matrix/RoleMatrixHeaderBar';
import RoleMatrixTable from './matrix/RoleMatrixTable';

export default function RoleMatrixTab({
  roles = [],
  rolesPermMap = {},
  toggleRolePermission,
  handleResetToDefaults,
  handleSaveAllRolePermissions,
  permissionsGrouped = [],
  savingPerms = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate total permissions count across modules
  const totalPermCount = permissionsGrouped.reduce(
    (acc, grp) => acc + (grp.permissions || []).length,
    0
  );

  return (
    <div className="pb-8">
      {/* 1. Header Toolbar with Stats, Search, and Action Buttons */}
      <RoleMatrixHeaderBar
        roles={roles}
        rolesPermMap={rolesPermMap}
        totalPermCount={totalPermCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        savingPerms={savingPerms}
        onSaveAll={handleSaveAllRolePermissions}
        onResetDefaults={handleResetToDefaults}
      />

      {/* 2. Side-by-Side Unified Role & Permission Matrix Table */}
      <RoleMatrixTable
        roles={roles}
        permissionsGrouped={permissionsGrouped}
        rolesPermMap={rolesPermMap}
        searchTerm={searchTerm}
        toggleRolePermission={toggleRolePermission}
      />
    </div>
  );
}
