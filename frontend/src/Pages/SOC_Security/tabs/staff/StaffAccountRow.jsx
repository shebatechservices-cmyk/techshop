import React from "react";

export default function StaffAccountRow({
  user: u,
  index: idx,
  handleOpenEditStaff,
  handleToggleUserLock,
  showToast,
  setStaffToDelete,
}) {
  const roleBadgeClass =
    u.role_name === "Super Admin"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : u.role_name === "Branch Manager"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : u.role_name === "Sales Executive"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : u.role_name === "Field Technician"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : u.role_name === "Inventory Officer"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : u.role_name === "Accountant"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <tr
      className={`border-b border-slate-100 ${
        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
      } hover:bg-slate-50 transition-colors`}
    >
      <td className="px-3.5 py-3">
        <div className="font-bold text-slate-900">{u.name}</div>
        {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
      </td>

      <td className="px-3.5 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${roleBadgeClass}`}>
          {u.role_name}
        </span>
      </td>

      <td className="px-3.5 py-3 text-slate-700">
        <div>📞 {u.phone}</div>
        <div className="text-xs text-slate-500">
          Last Login:{" "}
          {u.last_login
            ? new Date(u.last_login).toLocaleString("en-GB")
            : "Active Today"}
        </div>
      </td>

      <td className="px-3.5 py-3">
        {u.device_id ? (
          <span className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-semibold">
            📱 {u.device_id}
          </span>
        ) : (
          <span className="text-xs text-slate-500">Unrestricted Device</span>
        )}
      </td>

      <td className="px-3.5 py-3 text-xs text-slate-600">
        {u.allowed_ip === "Any IP" ? (
          <span>🌐 Any IP</span>
        ) : (
          <span className="font-mono text-emerald-700 font-semibold">
            🔒 {u.allowed_ip}
          </span>
        )}
      </td>

      <td className="px-3.5 py-3 text-center">
        {u.is_locked ? (
          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
            🔒 LOCKED
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
            ✓ ACTIVE
          </span>
        )}
      </td>

      <td className="px-3.5 py-3 text-center">
        <div className="flex justify-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenEditStaff(u)}
            className="px-2 py-1 rounded border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold cursor-pointer transition-colors"
            title="Edit Staff / Technician Details"
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            onClick={() => handleToggleUserLock(u)}
            className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
              u.is_locked
                ? "border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                : "border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700"
            }`}
          >
            {u.is_locked ? "🔓 Unlock" : "🔒 Lock"}
          </button>

          <button
            type="button"
            onClick={() => {
              handleOpenEditStaff(u);
              if (showToast) showToast(`Update credentials/PIN for ${u.name}`);
            }}
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Reset Password / PIN"
          >
            🔑 PIN
          </button>

          {u.id !== 1 && (
            <button
              type="button"
              onClick={() => setStaffToDelete(u)}
              className="px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
              title="Delete Staff / Technician"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
