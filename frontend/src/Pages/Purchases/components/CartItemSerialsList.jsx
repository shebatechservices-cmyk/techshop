import React from 'react';
import { CameraIcon } from './CartItemCameraScanner';

export function CartItemSerialChips({
  item,
  barcodesList = [],
  handleRemoveBarcode,
}) {
  if (!barcodesList || barcodesList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {barcodesList.map((sn) => (
        <span
          key={sn}
          className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full py-0.5 px-2.5 text-xs font-semibold text-emerald-800"
        >
          <span>{sn}</span>
          <button
            type="button"
            onClick={() => handleRemoveBarcode && handleRemoveBarcode(item?.localId, sn)}
            className="bg-transparent border-0 text-rose-600 cursor-pointer text-xs p-0 hover:text-rose-800"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

export default function CartItemSerialsList({
  item,
  tempBarcode,
  setTempBarcode,
  inputRef,
  onAdd,
  setIsCameraScannerOpen,
  barcodesList = [],
  barcodeScanErrors = {},
  handleRemoveBarcode,
  isSerialTracked,
  renderChips = true,
}) {
  return (
    <div className="min-w-0 flex flex-col items-start w-full">
      {!isSerialTracked ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-md py-1 px-2.5 flex items-center h-[28px] box-border">
          <span className="text-xs text-slate-500 font-semibold truncate">
            📦 Non-serialized product
          </span>
        </div>
      ) : (
        <div className="w-full max-w-xs">
          <div className="flex justify-between items-center mb-0.5 gap-1 min-w-0">
            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-900 whitespace-nowrap overflow-hidden">
              <span className="truncate">📷 Scan Serial</span>
              <span
                className={`text-[0.65rem] font-bold whitespace-nowrap ${
                  barcodesList.length > 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                ({barcodesList.length})
              </span>
            </label>
            {barcodesList.length > 0 && (
              <span
                className="text-[0.62rem] text-sky-700 font-semibold bg-sky-100 py-0.25 px-1 rounded whitespace-nowrap"
                title="All subsequent serials must match this length"
              >
                Ref: {barcodesList[0].length}
              </span>
            )}
          </div>
          <div className="relative flex items-center w-full">
            <input
              ref={inputRef}
              type="text"
              value={tempBarcode}
              onChange={(e) => setTempBarcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAdd) onAdd(e);
                }
              }}
              placeholder="Scan serial..."
              className={`w-full py-1 pl-2.5 pr-14 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all bg-white ${
                barcodeScanErrors[item?.localId] || barcodesList.length === 0
                  ? 'border-2 border-rose-400 focus:border-rose-500'
                  : 'border border-slate-300 focus:border-emerald-500'
              }`}
            />

            <div className="absolute right-1 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen && setIsCameraScannerOpen(true)}
                title="Open Camera Scanner"
                className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer border-0 bg-transparent p-0"
              >
                <CameraIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAdd) onAdd(e);
                }}
                title="Add Serial"
                className="w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-xs flex items-center justify-center border-0 cursor-pointer transition-colors leading-none"
              >
                +
              </button>
            </div>
          </div>
          {barcodeScanErrors[item?.localId] && (
            <div className="text-[11px] text-rose-600 mt-0.5 font-semibold truncate">
              {barcodeScanErrors[item.localId]}
            </div>
          )}
        </div>
      )}

      {/* Serial Chips */}
      {renderChips && (
        <CartItemSerialChips
          item={item}
          barcodesList={barcodesList}
          handleRemoveBarcode={handleRemoveBarcode}
        />
      )}
    </div>
  );
}
