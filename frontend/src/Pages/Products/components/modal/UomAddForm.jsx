import React from 'react';

export default function UomAddForm({
  newName,
  setNewName,
  newCode,
  setNewCode,
  newFractional,
  setNewFractional,
  newActive,
  setNewActive,
  adding,
  handleAddUom
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-3.5 mb-4">
      <span className="block text-[0.82rem] font-bold text-slate-900 mb-2">
        + Add New Unit of Measurement
      </span>
      <form onSubmit={handleAddUom} className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          placeholder="Unit Name (e.g. Meter, Box, Pcs)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          className="flex-[2_1_160px] py-[7px] px-2.5 rounded-md border border-slate-300 text-[0.82rem] box-border focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
        />
        <input
          type="text"
          placeholder="Code (e.g. MTR, BOX)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
          className="flex-[1_1_90px] py-[7px] px-2.5 rounded-md border border-slate-300 text-[0.82rem] uppercase box-border focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
        />
        <label className="flex items-center gap-1 text-[0.78rem] text-sky-700 font-semibold cursor-pointer bg-sky-100 py-1.5 px-2 rounded-md hover:bg-sky-200/70 transition-colors">
          <input
            type="checkbox"
            checked={newFractional}
            onChange={(e) => setNewFractional(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          Allow Fractional (e.g. 1.5)
        </label>
        <label className="flex items-center gap-1 text-[0.78rem] text-slate-600 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={newActive}
            onChange={(e) => setNewActive(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          Active
        </label>
        <button
          type="submit"
          disabled={adding}
          className={`py-[7px] px-3.5 rounded-md font-bold text-[0.82rem] text-white transition-colors ${
            adding
              ? 'bg-sky-400 cursor-not-allowed'
              : 'bg-sky-600 hover:bg-sky-700 cursor-pointer shadow-sm'
          }`}
        >
          {adding ? 'Adding...' : '+ Add'}
        </button>
      </form>
    </div>
  );
}
