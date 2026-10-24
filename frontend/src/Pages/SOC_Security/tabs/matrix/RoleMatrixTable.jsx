import React from 'react';

export default function RoleMatrixTable({
  roles = [],
  permissionsGrouped = [],
  rolesPermMap = {},
  searchTerm = '',
  toggleRolePermission,
}) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Filter modules and permissions based on search query
  const filteredGrouped = permissionsGrouped.map((grp) => {
    const matchingPerms = (grp.permissions || []).filter((p) => {
      if (!normalizedSearch) return true;
      return (
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.code.toLowerCase().includes(normalizedSearch) ||
        (grp.module_name || grp.module || '').toLowerCase().includes(normalizedSearch)
      );
    });
    return { ...grp, permissions: matchingPerms };
  }).filter((grp) => grp.permissions.length > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
              <th className="py-3.5 px-4 font-black uppercase tracking-wider min-w-[280px]">
                Privilege / Permission Action
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="py-3.5 px-3 text-center font-bold whitespace-nowrap min-w-[100px] border-l border-slate-800"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-base">{role.icon || '💼'}</span>
                    <span className="text-xs font-black tracking-tight">{role.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {(rolesPermMap[role.id] || []).length} active
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredGrouped.length === 0 ? (
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="py-12 text-center text-slate-400 font-semibold"
                >
                  No permissions found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredGrouped.map((grp, grpIdx) => (
                <React.Fragment key={grp.module_name || grp.module || grpIdx}>
                  {/* Module Section Group Header */}
                  <tr className="bg-slate-100/80 font-black text-slate-800 border-t border-b border-slate-200">
                    <td
                      colSpan={roles.length + 1}
                      className="py-2.5 px-4 uppercase text-[11px] tracking-wider text-slate-700 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                        <span>{grp.module_name || grp.module}</span>
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {grp.permissions.length} actions
                      </span>
                    </td>
                  </tr>

                  {/* Individual Permission Rows */}
                  {grp.permissions.map((p) => (
                    <tr
                      key={p.code}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Permission Description & Code */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs group-hover:text-slate-900 font-bold">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.code}
                          </span>
                        </div>
                      </td>

                      {/* Checkbox cell for each role */}
                      {roles.map((role) => {
                        const isGranted = (rolesPermMap[role.id] || []).includes(p.code);
                        const isLockedSuperAdmin =
                          Number(role.id) === 1 && p.code === 'edit_role_permissions';

                        return (
                          <td
                            key={role.id}
                            className={`py-2 px-3 text-center border-l border-slate-100 transition-colors ${
                              isGranted ? 'bg-teal-50/20' : ''
                            }`}
                          >
                            <label className="inline-flex items-center justify-center p-1.5 cursor-pointer rounded-lg hover:bg-slate-100/80 transition-colors">
                              <input
                                type="checkbox"
                                checked={isGranted}
                                disabled={isLockedSuperAdmin}
                                onChange={() => toggleRolePermission(role.id, p.code)}
                                className={`w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer ${
                                  isLockedSuperAdmin ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
