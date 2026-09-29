import React from 'react';

export default function WarehouseTable({
  loading,
  warehouses,
  onSetDefault,
  onEdit,
  onDelete,
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full border-collapse text-xs text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
            <th className="px-3 py-2">Warehouse Name & Code</th>
            <th className="px-3 py-2">Location / Address</th>
            <th className="px-3 py-2">Contact Person</th>
            <th className="px-3 py-2 text-center">Stock Status</th>
            <th className="px-3 py-2 text-center">Status</th>
            <th className="px-3 py-2 text-center w-[120px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-7 px-4 text-slate-500">
                <div className="text-lg mb-1 animate-spin inline-block">🔄</div>
                <div>Loading warehouses...</div>
              </td>
            </tr>
          ) : warehouses.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-7 px-4 text-slate-500">
                No warehouses found matching your query.
              </td>
            </tr>
          ) : (
            warehouses.map((wh) => (
              <tr
                key={wh.id}
                className={`border-b border-slate-100 transition-colors ${
                  wh.is_default ? 'bg-sky-50' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Name & Code */}
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {wh.name}
                    </span>
                    {wh.is_default && (
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                        ★ DEFAULT
                      </span>
                    )}
                  </div>
                  {wh.code && (
                    <span className="font-mono text-[11px] text-sky-700 bg-sky-100 px-1 py-0.5 rounded inline-block mt-0.5">
                      {wh.code}
                    </span>
                  )}
                </td>

                {/* Location / Address */}
                <td className="px-3 py-2 align-middle text-slate-700">
                  <div className="font-semibold">{wh.location || '—'}</div>
                  {wh.address && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {wh.address}
                    </div>
                  )}
                </td>

                {/* Contact */}
                <td className="px-3 py-2 align-middle text-slate-700">
                  <div className="font-semibold">{wh.contact_person || '—'}</div>
                  {wh.phone && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      📞 {wh.phone}
                    </div>
                  )}
                </td>

                {/* Stock Summary */}
                <td className="px-3 py-2 text-center align-middle">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block">
                    {Number(wh.total_stock_units || 0).toLocaleString()} units
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2 text-center align-middle">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                      wh.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span>{wh.is_active ? '🟢' : '⚪'}</span>
                    <span>{wh.is_active ? 'Active' : 'Inactive'}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex items-center justify-center gap-1">
                    {!wh.is_default && (
                      <button
                        type="button"
                        onClick={() => onSetDefault(wh)}
                        className="bg-slate-50 hover:bg-amber-50 border border-slate-300 hover:border-amber-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-700 cursor-pointer transition-colors"
                        title="Set as default warehouse"
                      >
                        ★ Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(wh)}
                      className="bg-slate-50 hover:bg-sky-50 border border-slate-300 hover:border-sky-300 rounded px-1.5 py-0.5 text-xs text-sky-600 cursor-pointer transition-colors"
                      title="Edit warehouse details"
                    >
                      ✏️
                    </button>
                    {!wh.is_default && (
                      <button
                        type="button"
                        onClick={() => onDelete(wh)}
                        className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded px-1.5 py-0.5 text-xs text-red-600 cursor-pointer transition-colors"
                        title="Delete warehouse"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
