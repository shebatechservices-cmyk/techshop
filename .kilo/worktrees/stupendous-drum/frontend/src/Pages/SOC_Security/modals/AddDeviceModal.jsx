import React from "react";

export default function AddDeviceModal({
  isOpen,
  onClose,
  newDevice,
  setNewDevice,
  handleCreateDevice,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-[3px] flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
        <h3 className="m-0 mb-4 text-lg font-black text-slate-900">
          + Authorize Hardware Device ID
        </h3>
        <form onSubmit={handleCreateDevice}>
          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Unique Device ID / Fingerprint *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DEV-POS-03 or MOB-SAMSUNG-A54"
              value={newDevice.device_id}
              onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Device Name / Friendly Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Technician Al-Amin Field Tablet"
              value={newDevice.device_name}
              onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900 box-border"
            />
          </div>

          <div className="mb-4.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Device Type
            </label>
            <select
              value={newDevice.device_type}
              onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-700"
            >
              <option value="desktop">Desktop / Laptop Workstation</option>
              <option value="mobile">Field Technician Mobile Phone</option>
              <option value="pos_terminal">Counter POS Dedicated Machine</option>
              <option value="tablet">Warehouse Inventory Tablet</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors border-0"
            >
              Authorize Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
