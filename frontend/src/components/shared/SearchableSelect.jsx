import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function SearchableSelect({
  name = '',
  value = '',
  onChange = () => {},
  options = [],
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  disabled = false,
  disabledPlaceholder = '',
  required = false,
  valueKey = 'id',
  labelKey = 'name',
  className = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options and sort them alphabetically A-Z
  const sortedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return [...options].sort((a, b) => {
      const labelA = String(typeof a === 'object' && a !== null ? (a[labelKey] ?? a.label ?? a[valueKey] ?? '') : a);
      const labelB = String(typeof b === 'object' && b !== null ? (b[labelKey] ?? b.label ?? b[valueKey] ?? '') : b);
      return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
    });
  }, [options, labelKey, valueKey]);

  // Find currently selected option
  const selectedItem = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return (
      sortedOptions.find((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          const optVal = opt[valueKey] !== undefined ? opt[valueKey] : opt.id ?? opt.value;
          return String(optVal) === String(value);
        }
        return String(opt) === String(value);
      }) || null
    );
  }, [sortedOptions, value, valueKey]);

  // Filter options based on user search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return sortedOptions;
    const q = searchQuery.toLowerCase().trim();
    return sortedOptions.filter((opt) => {
      const label = String(typeof opt === 'object' && opt !== null ? (opt[labelKey] ?? opt.label ?? opt[valueKey] ?? '') : opt);
      return label.toLowerCase().includes(q);
    });
  }, [sortedOptions, searchQuery, labelKey, valueKey]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    const optVal = typeof opt === 'object' && opt !== null ? (opt[valueKey] !== undefined ? opt[valueKey] : opt.id ?? opt.value) : opt;
    onChange({
      target: {
        name,
        value: optVal,
      },
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({
      target: {
        name,
        value: '',
      },
    });
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  const displayPlaceholder = disabled && disabledPlaceholder ? disabledPlaceholder : placeholder;
  const selectedLabel = selectedItem
    ? typeof selectedItem === 'object' && selectedItem !== null
      ? (selectedItem[labelKey] ?? selectedItem.label ?? selectedItem[valueKey])
      : selectedItem
    : '';

  return (
    <div className={`relative flex-1 ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button styled like standard form select */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery('');
          }
        }}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm flex items-center justify-between text-left transition-all ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
            : isOpen
            ? 'bg-white border-sky-500 ring-2 ring-sky-100 text-slate-800'
            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800 cursor-pointer shadow-xs'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate mr-2 ${!selectedItem ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
          {selectedItem ? selectedLabel : displayPlaceholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedItem && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="hover:text-rose-600 hover:bg-slate-100 p-0.5 rounded transition-colors text-xs font-bold leading-none cursor-pointer"
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Hidden input to guarantee HTML required form validation */}
      <input
        type="text"
        name={name}
        value={value || ''}
        onChange={() => {}}
        required={required && !disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 animate-fadeIn">
          {/* Search Box Header */}
          <div className="px-3 pb-2 pt-1 border-b border-slate-100">
            <div className="relative">
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 focus:bg-white text-slate-800 font-medium transition-all"
                style={{ paddingLeft: '2.25rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1 select-none">
              <span className="flex items-center gap-1 font-semibold text-sky-700">
                <span>🔤</span> A–Z Alphabetical
              </span>
              <span>
                {filteredOptions.length} of {sortedOptions.length}
              </span>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="py-5 px-4 text-center text-xs text-slate-400">
                {searchQuery ? (
                  <>
                    No matching results for <strong className="text-slate-600">"{searchQuery}"</strong>
                  </>
                ) : (
                  'No options available (click + to add)'
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optVal = typeof opt === 'object' && opt !== null ? (opt[valueKey] !== undefined ? opt[valueKey] : opt.id ?? opt.value) : opt;
                const optLabel = typeof opt === 'object' && opt !== null ? (opt[labelKey] ?? opt.label ?? opt[valueKey]) : opt;
                const isSelected = String(optVal) === String(value);

                return (
                  <button
                    key={String(optVal)}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 text-sky-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-normal'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && (
                      <span className="text-sky-600 font-bold text-xs shrink-0 ml-2">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
