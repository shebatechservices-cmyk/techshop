import React from 'react';

/**
 * Dropdown popover for selecting an in-stock serial barcode for a tracked item.
 */
export default function SaleProductSerialPicker({
  item,
  openPickerId,
  setOpenPickerId,
  isSerialMissing,
  handleAddBarcode,
}) {
  const isOpen = openPickerId === item.localId;

  return (
    <div className="relative inline-flex items-center serial-picker-container shrink-0">
      <button
        type="button"
        onClick={() => setOpenPickerId(isOpen ? null : item.localId)}
        title="Pick available serial from inventory"
        className={`px-1.5 py-0.5 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
            : isSerialMissing
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
        }`}
      >
        <span>📋</span>
        <span className="text-[10px] font-sans font-semibold">
          {isSerialMissing ? 'Pick Serial' : 'Serials'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-64 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-2xl p-2 z-[999999] text-left font-normal">
          <div className="text-[11px] font-bold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-200 flex items-center justify-between">
            <span>Available Stock Serials</span>
            <span className="text-[10px] text-slate-500 font-normal">
              ({(item.available_serials || []).length} in stock)
            </span>
          </div>

          {item.available_serials && item.available_serials.length > 0 ? (
            <div className="flex flex-col gap-1">
              {item.available_serials.map((serialCode, sIdx) => {
                const isSelected = (item.serials || []).includes(serialCode);
                return (
                  <button
                    key={sIdx}
                    type="button"
                    disabled={isSelected}
                    onClick={() => {
                      handleAddBarcode(item.localId, serialCode);
                      setOpenPickerId(null);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-mono flex items-center justify-between border-0 transition-colors ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 cursor-pointer'
                    }`}
                  >
                    <span>{serialCode}</span>
                    {isSelected ? (
                      <span className="text-[10px] text-emerald-600 font-sans font-bold">✓ Added</span>
                    ) : (
                      <span className="text-[10px] text-indigo-600 font-sans font-semibold">+ Select</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-3 px-2 text-center text-xs text-slate-400">
              No available serial numbers in stock
            </div>
          )}
        </div>
      )}
    </div>
  );
}
