import React from 'react';
import BangladeshiPhoneInput from '../../../../components/ui/BangladeshiPhoneInput';

export default function WarehouseForm({
  editingId,
  formData,
  setFormData,
  saving,
  onSave,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSave}
      className="bg-slate-50 border-2 border-sky-600 rounded-lg p-3.5 mb-4 shadow-sm"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-extrabold text-sm text-sky-700">
          {editingId ? '✏️ Edit Warehouse Details' : '➕ Add New Warehouse / Branch'}
        </span>
        <span className="text-xs text-slate-500">
          Fields marked with * are required
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mb-2.5">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Warehouse Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Main Shop, Agrabad Branch"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-sky-500 box-border bg-white"
          />
        </div>

        {/* Code */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Warehouse Code / Tag
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. WH-MAIN, WH-01"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm font-mono outline-none focus:border-sky-500 box-border bg-white uppercase"
          />
        </div>

        {/* Location / Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            City / Location Zone
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Dhaka Central, Chittagong Port"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-sky-500 box-border bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mb-2.5">
        {/* Full Address */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Address / Road
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Level 3, Suite 402, Motijheel C/A, Dhaka"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-sky-500 box-border bg-white"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Contact Person Name
          </label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="e.g. Store Manager"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-sky-500 box-border bg-white"
          />
        </div>

        {/* Phone */}
        <div>
          <BangladeshiPhoneInput
            label="Phone / Mobile Number"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="1X-XXXXXXXX"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-5 my-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            className="cursor-pointer rounded text-sky-600 focus:ring-sky-500"
          />
          <span>★ Set as Default Warehouse</span>
        </label>

        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="cursor-pointer rounded text-sky-600 focus:ring-sky-500"
          />
          <span>🟢 Active (Available for Sales & Purchases)</span>
        </label>
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {saving ? 'Saving...' : editingId ? '✓ Update Warehouse' : '✓ Create Warehouse'}
        </button>
      </div>
    </form>
  );
}
