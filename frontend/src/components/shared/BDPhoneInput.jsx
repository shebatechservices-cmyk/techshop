import React, { useState, useEffect, useRef, useId } from 'react';
import { extractBDDigits, formatBDDigits, toCleanBDPhone } from '../../utils/phoneUtils';

export default function BDPhoneInput({
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
  showCountryBadge = true,
  helperText = '',
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);

  // Extract raw 10 digits from incoming prop value
  const rawDigits = extractBDDigits(value);
  const [digits, setDigits] = useState(rawDigits);
  const [touched, setTouched] = useState(false);

  // Sync state if external value changes
  useEffect(() => {
    const extracted = extractBDDigits(value);
    setDigits(extracted);
  }, [value]);

  // Set HTML5 custom validity to block native form submission if invalid
  useEffect(() => {
    if (!inputRef.current) return;
    if (required && digits.length === 0) {
      inputRef.current.setCustomValidity('Phone number is required.');
    } else if (digits.length > 0 && digits.length < 10) {
      inputRef.current.setCustomValidity('Please enter a complete 10-digit number (e.g. 17XXXXXXXX).');
    } else {
      inputRef.current.setCustomValidity('');
    }
  }, [digits, required]);

  // Notify parent of changes with standardized clean value ("01XXXXXXXXX")
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

  // Block non-numeric keystrokes
  const handleKeyDown = (e) => {
    // Allow navigation, deletion, clipboard shortcuts
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

    // Allow Ctrl/Cmd/Alt combinations (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // If key is not a digit (0-9), strictly block it
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // If already 10 digits and user didn't highlight text, block more digits
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
        className={`relative flex items-center rounded-lg border transition-all duration-150 bg-white ${
          disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''
        } ${
          isInvalid
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100'
        }`}
      >
        {showCountryBadge && (
          <div
            className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none shrink-0 rounded-l-lg"
            title="Bangladesh (+880)"
          >
            <span className="text-sm">🇧🇩</span>
            <span className="tracking-tight text-slate-800">+880</span>
          </div>
        )}

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

      {/* Error or helper message */}
      {isInvalid && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5">
          <span>⚠️</span>
          <span>
            {error ||
              (digits.length === 0 && required
                ? 'Phone number is required.'
                : 'Please enter a valid 10-digit number (e.g. 17-12345678).')}
          </span>
        </p>
      )}

      {helperText && !isInvalid && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
