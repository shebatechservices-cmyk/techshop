import React from 'react';

export default function CalculatorKeypad({
  isClearAll,
  clearAll,
  clearEntry,
  toggleSign,
  inputPercent,
  performOperation,
  inputDigit,
  inputDecimal,
  handleEquals,
  operator,
  waitingForOperand,
}) {
  return (
    <div className="grid grid-cols-4 gap-3 pt-1">
      {/* Row 1: Top Actions (AC, +/-, %) & Divide (÷) */}
      <button
        type="button"
        onClick={isClearAll ? clearAll : clearEntry}
        className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        {isClearAll ? 'AC' : 'C'}
      </button>
      <button
        type="button"
        onClick={toggleSign}
        className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        +/−
      </button>
      <button
        type="button"
        onClick={inputPercent}
        className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        %
      </button>
      <button
        type="button"
        onClick={() => performOperation('÷')}
        className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
          operator === '÷' && waitingForOperand
            ? 'bg-white text-[#ff9f0a]'
            : 'bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775]'
        }`}
      >
        ÷
      </button>

      {/* Row 2: 7, 8, 9 & Multiply (×) */}
      <button
        type="button"
        onClick={() => inputDigit('7')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        7
      </button>
      <button
        type="button"
        onClick={() => inputDigit('8')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        8
      </button>
      <button
        type="button"
        onClick={() => inputDigit('9')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        9
      </button>
      <button
        type="button"
        onClick={() => performOperation('×')}
        className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
          operator === '×' && waitingForOperand
            ? 'bg-white text-[#ff9f0a]'
            : 'bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775]'
        }`}
      >
        ×
      </button>

      {/* Row 3: 4, 5, 6 & Subtract (-) */}
      <button
        type="button"
        onClick={() => inputDigit('4')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        4
      </button>
      <button
        type="button"
        onClick={() => inputDigit('5')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        5
      </button>
      <button
        type="button"
        onClick={() => inputDigit('6')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        6
      </button>
      <button
        type="button"
        onClick={() => performOperation('−')}
        className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
          (operator === '−' || operator === '-') && waitingForOperand
            ? 'bg-white text-[#ff9f0a]'
            : 'bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775]'
        }`}
      >
        −
      </button>

      {/* Row 4: 1, 2, 3 & Add (+) */}
      <button
        type="button"
        onClick={() => inputDigit('1')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        1
      </button>
      <button
        type="button"
        onClick={() => inputDigit('2')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        2
      </button>
      <button
        type="button"
        onClick={() => inputDigit('3')}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        3
      </button>
      <button
        type="button"
        onClick={() => performOperation('+')}
        className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
          operator === '+' && waitingForOperand
            ? 'bg-white text-[#ff9f0a]'
            : 'bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775]'
        }`}
      >
        +
      </button>

      {/* Row 5: 0 (Span 2 & Pill Shaped), . & Equals (=) */}
      <button
        type="button"
        onClick={() => inputDigit('0')}
        className="col-span-2 rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl pl-6 sm:pl-7 flex items-center justify-start transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        0
      </button>
      <button
        type="button"
        onClick={inputDecimal}
        className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        .
      </button>
      <button
        type="button"
        onClick={handleEquals}
        className="aspect-square rounded-full bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775] text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
      >
        =
      </button>
    </div>
  );
}
