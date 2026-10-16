import React from 'react';

export default function SearchInputBar({
  inputRef,
  query,
  loading,
  compact = false,
  onFocus,
  onKeyDown,
  onChange,
  onClear,
}) {
  return (
    <div
      className={`w-full flex items-center bg-white/90 border border-emerald-200/90 rounded-lg transition-all duration-150 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-2xs hover:border-emerald-300 ${
        compact ? 'px-3 py-1.5' : 'px-4 py-2'
      }`}
    >
      <svg
        className={`text-emerald-700 mr-2.5 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onChange={onChange}
        placeholder={compact ? "Scan barcode or search..." : "Global Search: Scan Barcode/Serial (S/N), Invoices, Products, Customers..."}
        className={`flex-1 min-w-0 border-none outline-none bg-transparent font-medium text-emerald-950 placeholder-slate-400 focus:outline-none focus:ring-0 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      />

      {/* Loading Spinner */}
      {loading && (
        <span className="text-xs font-semibold text-emerald-600 mr-2 animate-pulse flex-shrink-0">
          Searching...
        </span>
      )}

      {/* Clear Button */}
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-slate-400 hover:text-emerald-800 rounded-md transition-colors mr-1 flex-shrink-0"
          title="Clear search"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Shortcut Badge */}
      <span
        className={`hidden sm:inline-block bg-emerald-100/70 text-emerald-800 border border-emerald-200/80 font-semibold rounded tracking-wide select-none whitespace-nowrap flex-shrink-0 ${
          compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
        }`}
        title="Press Ctrl+K to search anytime"
      >
        {compact ? 'Ctrl+K' : 'Ctrl + K'}
      </span>
    </div>
  );
}
