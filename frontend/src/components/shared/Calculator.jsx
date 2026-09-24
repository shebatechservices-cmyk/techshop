import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Safe calculation evaluator for iOS/macOS styled calculator
 */
function calculate(firstOperand, operator, secondOperand) {
  const num1 = parseFloat(firstOperand);
  const num2 = parseFloat(secondOperand);
  if (isNaN(num1) || isNaN(num2)) return num2 || num1 || 0;

  let result = 0;
  switch (operator) {
    case '+':
      result = num1 + num2;
      break;
    case '−':
    case '-':
      result = num1 - num2;
      break;
    case '×':
    case '*':
      result = num1 * num2;
      break;
    case '÷':
    case '/':
      if (num2 === 0) return 'Error';
      result = num1 / num2;
      break;
    default:
      return num2;
  }

  // Handle precision
  const rounded = Math.round(result * 100000000) / 100000000;
  return rounded;
}

export default function Calculator({ isOpen, onClose }) {
  const [displayValue, setDisplayValue] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expressionPreview, setExpressionPreview] = useState('');
  const containerRef = useRef(null);

  // Auto-format large numbers with commas for display
  const formatDisplay = (val) => {
    if (val === 'Error') return 'Error';
    const parts = String(val).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Add commas to integer portion
    const formattedInteger = Number(integerPart).toLocaleString('en-US');
    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
  };

  // Adjust font size dynamically based on length
  const getDisplayFontSize = (text) => {
    const len = String(text).length;
    if (len > 10) return 'text-3xl';
    if (len > 7) return 'text-4xl';
    return 'text-5xl';
  };

  const inputDigit = useCallback((digit) => {
    setCopied(false);
    if (waitingForOperand) {
      setDisplayValue(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplayValue((prev) => (prev === '0' ? String(digit) : prev + String(digit)));
    }
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setCopied(false);
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue((prev) => prev + '.');
    }
  }, [waitingForOperand, displayValue]);

  const clearAll = useCallback(() => {
    setDisplayValue('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpressionPreview('');
    setCopied(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplayValue('0');
    setCopied(false);
  }, []);

  const toggleSign = useCallback(() => {
    setCopied(false);
    if (displayValue === '0' || displayValue === 'Error') return;
    setDisplayValue((prev) =>
      prev.startsWith('-') ? prev.slice(1) : '-' + prev
    );
  }, [displayValue]);

  const inputPercent = useCallback(() => {
    setCopied(false);
    if (displayValue === 'Error') return;
    const current = parseFloat(displayValue);
    if (isNaN(current)) return;
    
    if (prevValue !== null && operator) {
      // Percentage of previous value (e.g. 500 + 10% = 500 + 50)
      const percentVal = (prevValue * current) / 100;
      setDisplayValue(String(percentVal));
    } else {
      // Direct division by 100
      setDisplayValue(String(current / 100));
    }
  }, [displayValue, prevValue, operator]);

  const performOperation = useCallback((nextOperator) => {
    setCopied(false);
    const inputValue = parseFloat(displayValue);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpressionPreview(`${formatDisplay(displayValue)} ${nextOperator}`);
    } else if (operator) {
      if (waitingForOperand) {
        // Just change operator
        setOperator(nextOperator);
        setExpressionPreview(`${formatDisplay(prevValue)} ${nextOperator}`);
        return;
      }

      const result = calculate(prevValue, operator, inputValue);
      setDisplayValue(String(result));
      setPrevValue(result === 'Error' ? null : result);
      setExpressionPreview(
        result === 'Error'
          ? ''
          : `${formatDisplay(result)} ${nextOperator}`
      );
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [displayValue, prevValue, operator, waitingForOperand]);

  const handleEquals = useCallback(() => {
    setCopied(false);
    if (operator === null || prevValue === null) return;

    const inputValue = parseFloat(displayValue);
    const result = calculate(prevValue, operator, inputValue);

    setExpressionPreview(
      `${formatDisplay(prevValue)} ${operator} ${formatDisplay(displayValue)} =`
    );
    setDisplayValue(String(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [operator, prevValue, displayValue]);

  const handleBackspace = useCallback(() => {
    setCopied(false);
    if (waitingForOperand) return;
    if (displayValue.length > 1) {
      setDisplayValue((prev) => prev.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  }, [waitingForOperand, displayValue]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (['Backspace', 'Enter', '=', '/', '*', '+', '-'].includes(e.key)) {
        e.stopPropagation();
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (e.key === '-') {
        e.preventDefault();
        performOperation('−');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        inputPercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearAll();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        displayValue !== '0' ? clearEntry() : clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    isOpen,
    inputDigit,
    inputDecimal,
    performOperation,
    inputPercent,
    handleEquals,
    handleBackspace,
    clearAll,
    clearEntry,
    displayValue,
  ]);

  const handleCopy = () => {
    if (displayValue && displayValue !== 'Error') {
      navigator.clipboard?.writeText(String(displayValue).replace(/,/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (!isOpen) return null;

  const isClearAll = displayValue === '0' && prevValue === null;

  return (
    <div
      ref={containerRef}
      className="absolute top-12 right-0 w-[290px] sm:w-[315px] bg-black border border-neutral-800 rounded-[32px] p-4 shadow-2xl z-[10000] text-white flex flex-col gap-3 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top Bar: Close and Copy Actions */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          {displayValue !== '0' && displayValue !== 'Error' && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
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
          className="text-neutral-500 hover:text-white text-xs w-6 h-6 rounded-full hover:bg-neutral-800 flex items-center justify-center transition-colors"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* 2. Display: Large, right-aligned text at the top */}
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

      {/* Keypad: 4 Columns with Circular and Pill Shaped Buttons */}
      <div className="grid grid-cols-4 gap-3 pt-1">
        {/* Row 1: Top Actions (AC, +/-, %) & Divide (÷) */}
        <button
          type="button"
          onClick={isClearAll ? clearAll : clearEntry}
          className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          {isClearAll ? 'AC' : 'C'}
        </button>
        <button
          type="button"
          onClick={toggleSign}
          className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          +/−
        </button>
        <button
          type="button"
          onClick={inputPercent}
          className="aspect-square rounded-full bg-[#a5a5a5] hover:bg-[#d4d4d2] active:bg-[#e8e8e8] text-black font-medium text-lg flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => performOperation('÷')}
          className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
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
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => inputDigit('8')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => inputDigit('9')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => performOperation('×')}
          className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
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
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => inputDigit('5')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => inputDigit('6')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => performOperation('−')}
          className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
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
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => inputDigit('2')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => inputDigit('3')}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => performOperation('+')}
          className={`aspect-square rounded-full text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
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
          className="col-span-2 rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl pl-6 sm:pl-7 flex items-center justify-start transition-all active:scale-95 shadow-sm"
        >
          0
        </button>
        <button
          type="button"
          onClick={inputDecimal}
          className="aspect-square rounded-full bg-[#333333] hover:bg-[#444444] active:bg-[#555555] text-white font-normal text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="aspect-square rounded-full bg-[#ff9f0a] hover:bg-[#ffb03b] active:bg-[#fcc775] text-white font-medium text-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          =
        </button>
      </div>
    </div>
  );
}
