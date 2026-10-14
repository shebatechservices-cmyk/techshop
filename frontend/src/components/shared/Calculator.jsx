import React, { useRef } from 'react';
import useCalculator from './calculator/useCalculator';
import CalculatorDisplay from './calculator/CalculatorDisplay';
import CalculatorKeypad from './calculator/CalculatorKeypad';

export default function Calculator({ isOpen, onClose }) {
  const containerRef = useRef(null);

  const {
    displayValue,
    prevValue,
    operator,
    waitingForOperand,
    copied,
    expressionPreview,
    inputDigit,
    inputDecimal,
    clearAll,
    clearEntry,
    toggleSign,
    inputPercent,
    performOperation,
    handleEquals,
    handleCopy,
  } = useCalculator(isOpen);

  if (!isOpen) return null;

  const isClearAll = displayValue === '0' && prevValue === null;

  return (
    <div
      ref={containerRef}
      className="absolute top-12 right-0 w-[290px] sm:w-[315px] bg-black border border-neutral-800 rounded-[32px] p-4 shadow-2xl z-[10000] text-white flex flex-col gap-3 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      <CalculatorDisplay
        displayValue={displayValue}
        expressionPreview={expressionPreview}
        copied={copied}
        onCopy={handleCopy}
        onClose={onClose}
      />

      <CalculatorKeypad
        isClearAll={isClearAll}
        clearAll={clearAll}
        clearEntry={clearEntry}
        toggleSign={toggleSign}
        inputPercent={inputPercent}
        performOperation={performOperation}
        inputDigit={inputDigit}
        inputDecimal={inputDecimal}
        handleEquals={handleEquals}
        operator={operator}
        waitingForOperand={waitingForOperand}
      />
    </div>
  );
}
