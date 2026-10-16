import React from 'react';
import SearchResultsList from './globalSearch/SearchResultsList';
import SerialBarcodeQuickViewModal from './globalSearch/SerialBarcodeQuickViewModal';
import SearchInputBar from './globalSearch/SearchInputBar';
import useGlobalSearch from './globalSearch/hooks/useGlobalSearch';

export default function GlobalSearchBar({ onNavigate, compact = false, className = '' }) {
  const {
    query,
    isOpen,
    setIsOpen,
    loading,
    results,
    totalResults,
    modalOpen,
    setModalOpen,
    modalData,
    modalMatchType,
    modalScannedCode,
    inputRef,
    dropdownRef,
    handleQueryChange,
    handleSelect,
    handleClear,
    handleOpenBarcodeModal,
  } = useGlobalSearch(onNavigate);

  return (
    <div className={`relative w-full z-[900] ${className}`}>
      {/* Search Input Bar */}
      <SearchInputBar
        inputRef={inputRef}
        query={query}
        loading={loading}
        compact={compact}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleOpenBarcodeModal(query.trim());
          }
        }}
        onChange={(e) => handleQueryChange(e.target.value)}
        onClear={handleClear}
      />

      {/* Floating Dropdown Results Menu */}
      {isOpen && query.trim().length > 0 && (
        <SearchResultsList
          results={results}
          loading={loading}
          totalResults={totalResults}
          query={query}
          dropdownRef={dropdownRef}
          onSelect={handleSelect}
          onQuickView={(prod) => {
            handleOpenBarcodeModal(prod.matched_serial || prod.barcode || prod.sku, prod);
          }}
        />
      )}

      {/* Instant 4-Dimension Serial / Barcode Quick-View Modal */}
      <SerialBarcodeQuickViewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
        matchType={modalMatchType}
        scannedCode={modalScannedCode}
        onNavigate={onNavigate}
      />
    </div>
  );
}
