import React from "react";

export default function RoleMatrixTab({
  roles = [],
  selectedRoleId,
  setSelectedRoleId,
  handleSaveRolePermissions,
  savingPerms,
  permissionsGrouped = [],
  activeRolePerms = [],
  togglePermission,
}) {
  return (
    <div>
      {/* Role Pills Selector */}
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Select Role:
        </span>
        {roles.map((r) => {
          const isSelected = Number(selectedRoleId) === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRoleId(r.id)}
              className={`px-4 py-2 rounded-lg text-sm font-extrabold cursor-pointer transition-colors ${
                isSelected
                  ? "border-2 border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {/* Role Header Description */}
      {(() => {
        const curRole = roles.find((r) => r.id === Number(selectedRoleId)) || {};
        return (
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 sm:px-4.5 mb-5 flex justify-between items-center flex-wrap gap-3">
            <div>
              <strong className="text-base text-slate-900">{curRole.name || "Role"} Privileges</strong>
              <p className="mt-1 mb-0 text-xs text-slate-600">
                {curRole.description || "Configured system permissions for this role."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={savingPerms}
              className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white border-0 rounded-md font-extrabold text-sm cursor-pointer transition-colors shadow-sm"
            >
              {savingPerms ? "Saving..." : "💾 Save Permissions"}
            </button>
          </div>
        );
      })()}

      {/* Module Permission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {permissionsGrouped.map((grp, idx) => (
          <div
            key={grp.module_name || grp.module || idx}
            className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 shadow-sm"
          >
            <div className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex justify-between items-center">
              <span>{grp.module_name || grp.module}</span>
              <span className="text-xs text-slate-500 font-semibold">
                {(grp.permissions || []).filter((p) => activeRolePerms.includes(p.code)).length} / {(grp.permissions || []).length} Enabled
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(grp.permissions || []).map((p) => {
                const isChecked = activeRolePerms.includes(p.code);
                return (
                  <label
                    key={p.code}
                    className={`flex items-center gap-2.5 cursor-pointer text-sm transition-colors ${
                      isChecked ? "text-slate-900 font-semibold" : "text-slate-500 font-normal hover:text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(p.code)}
                      className="w-4 h-4 accent-teal-600 cursor-pointer rounded"
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
