import React from 'react';

export default function DevMaintenanceTab({
  loading,
  handleMaintenance,
  handleCleanInventoryStock,
}) {
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3.5 m-0">
          Database Health & Storage Maintenance
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1 m-0">
                SQLite VACUUM & ANALYZE
              </h5>
              <p className="text-slate-400 text-[11px] mb-3">
                Rebuilds the database file, repacks storage, and optimizes query indexes.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleMaintenance}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Optimizing...' : 'Run SQLite Vacuum'}
            </button>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1 m-0">
                Local Device ID Cache Reset
              </h5>
              <p className="text-slate-400 text-[11px] mb-3">
                Clears the stored local device token in this browser to simulate a fresh device.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('sheba_device_id');
                alert('Local device token cleared! Page will reload.');
                window.location.reload();
              }}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              Reset Browser Device Fingerprint
            </button>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 m-0">
                Zero All Product Stock Quantities
              </h5>
              <p className="text-slate-400 text-[11px] mb-3">
                Sets all product stock quantities to 0 across all warehouses without deleting products.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCleanInventoryStock('zero_stocks')}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              Force Reset All Stock to 0
            </button>
          </div>

          <div className="bg-slate-950/70 border border-rose-900/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 m-0">
                Wipe Catalog & Test Inventory
              </h5>
              <p className="text-slate-400 text-[11px] mb-3">
                Wipes all test products, barcodes, and inventory entries for a fresh store setup.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCleanInventoryStock('wipe_all')}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              ⚠️ Wipe Products & Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
