import React, { useState, useEffect, useRef, useId } from 'react';
import { extractBDDigits, formatBDDigits, toCleanBDPhone } from '../../utils/phoneUtils';

export default function BangladeshiPhoneInput({
  id,
  name = 'phone',
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder = '1X-XXXXXXXX',
  required = false,
  disabled = false,
  readOnly = false,
  error = '',
  label = '',
  className = '',
  inputClassName = '',
  autoFocus = false,
  showFlag = true,
  helperText = '',
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);

  // Extract raw 10 digits from incoming prop value
  const rawDigits = extractBDDigits(value);
  const [digits, setDigits] = useState(rawDigits);
  const [touched, setTouched] = useState(false);

  // Sync internal digits state when external value changes
  useEffect(() => {
    const extracted = extractBDDigits(value);
    setDigits(extracted);
  }, [value]);

  // Set HTML5 custom validity to prevent invalid native form submission
  useEffect(() => {
    if (!inputRef.current) return;
    if (required && digits.length === 0) {
      inputRef.current.setCustomValidity('Phone number is required.');
    } else if (digits.length > 0 && digits.length < 10) {
      inputRef.current.setCustomValidity('Please enter a valid 10-digit number after +880 (e.g. 17XXXXXXXX).');
    } else {
      inputRef.current.setCustomValidity('');
    }
  }, [digits, required]);

  // Notify parent component with standardized clean value ("01XXXXXXXXX")
  const triggerChange = (newDigits) => {
    setDigits(newDigits);
    const cleanPhone = newDigits ? toCleanBDPhone(newDigits) : '';

    if (typeof onChange === 'function') {
      const syntheticEvent = {
        target: {
          name,
          value: cleanPhone,
          rawDigits: newDigits,
          formatted: newDigits ? `+880 ${formatBDDigits(newDigits)}` : '',
        },
        currentTarget: {
          name,
          value: cleanPhone,
        },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent);
    }
  };

  // Strictly intercept keydown events to block non-numeric characters
  const handleKeyDown = (e) => {
    const allowedSpecialKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
      'Enter',
      'Escape',
    ];

    if (allowedSpecialKeys.includes(e.key)) return;

    // Allow standard keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Meta+...)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Strictly block non-numeric characters (alphabets, symbols, spaces)
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Limit to exactly 10 digits after +880 unless text is currently selected
    const selectionLength = (e.target.selectionEnd || 0) - (e.target.selectionStart || 0);
    if (digits.length >= 10 && selectionLength === 0) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const extracted = extractBDDigits(raw);
    triggerChange(extracted);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const extracted = extractBDDigits(pasteData);
    triggerChange(extracted);
  };

  const handleBlur = (e) => {
    setTouched(true);
    if (typeof onBlur === 'function') onBlur(e);
  };

  const handleFocus = (e) => {
    if (typeof onFocus === 'function') onFocus(e);
  };

  const isInvalid = Boolean(
    error || (touched && digits.length > 0 && digits.length < 10) || (touched && required && digits.length === 0)
  );

  const displayFormatted = formatBDDigits(digits);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-lg border transition-all duration-150 bg-white overflow-hidden ${
          disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''
        } ${
          isInvalid
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100'
        }`}
      >
        {/* Permanent read-only +880 prefix on the left */}
        <div
          className="flex items-center gap-1 px-3 py-2 bg-slate-100 border-r border-slate-200 text-xs font-extrabold text-slate-800 select-none shrink-0"
          title="Permanent Prefix: Bangladesh (+880)"
        >
          {showFlag && <span className="text-sm select-none">🇧🇩</span>}
          <span className="tracking-tight text-slate-900 font-mono font-bold">+880</span>
        </div>

        {/* 10-digit number input */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{2}-[0-9]{8}"
          autoComplete="tel-national"
          value={displayFormatted}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-mono tracking-wider ${inputClassName}`}
        />

        {digits.length > 0 && !disabled && !readOnly && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => triggerChange('')}
            className="px-2.5 text-slate-400 hover:text-slate-600 text-xs transition-colors cursor-pointer"
            title="Clear phone number"
          >
            ✕
          </button>
        )}
      </div>

      {/* Inline Error / Validation Message */}
      {isInvalid && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5">
          <span>⚠️</span>
          <span>
            {error ||
              (digits.length === 0 && required
                ? 'Phone number is required.'
                : 'Please enter exactly 10 digits after +880 (e.g. 17-12345678).')}
          </span>
        </p>
      )}

      {helperText && !isInvalid && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
