import React from 'react';
import { formatDisplay, getDisplayFontSize } from './calculatorEngine';

export default function CalculatorDisplay({
  displayValue,
  expressionPreview,
  copied,
  onCopy,
  onClose,
}) {
  return (
    <>
      {/* Top Bar: Close and Copy Actions */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          {displayValue !== '0' && displayValue !== 'Error' && (
            <button
              type="button"
              onClick={onCopy}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? (
                <span className="text-emerald-400 font-bold">✓ Copied</span>
              ) : (
                <span>📋 Copy</span>
              )}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-500 hover:text-white text-xs w-6 h-6 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Display: Large, right-aligned text */}
      <div className="px-2 pt-2 pb-1 flex flex-col justify-end text-right min-h-[90px]">
        {/* Expression Preview */}
        <div className="text-neutral-400 text-xs font-normal h-4 overflow-hidden text-ellipsis whitespace-nowrap mb-1 tracking-wide">
          {expressionPreview}
        </div>
        {/* Main Display Value */}
        <div
          className={`font-light text-white tracking-tight break-all transition-all duration-100 ${getDisplayFontSize(
            displayValue
          )}`}
        >
          {formatDisplay(displayValue)}
        </div>
      </div>
    </>
  );
}
