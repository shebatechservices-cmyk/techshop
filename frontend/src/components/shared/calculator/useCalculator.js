import { useState, useCallback, useEffect } from 'react';
import { calculate, formatDisplay } from './calculatorEngine';

export default function useCalculator(isOpen) {
  const [displayValue, setDisplayValue] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expressionPreview, setExpressionPreview] = useState('');

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
      const percentVal = (prevValue * current) / 100;
      setDisplayValue(String(percentVal));
    } else {
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

  return {
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
    handleBackspace,
    handleCopy,
  };
}
