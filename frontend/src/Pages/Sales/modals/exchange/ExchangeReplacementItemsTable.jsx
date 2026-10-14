import React from 'react';
import ExchangeProductSearch from './replacement/ExchangeProductSearch';
import ExchangeReplacementItemRow from './replacement/ExchangeReplacementItemRow';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExchangeReplacementItemsTable({
  newItems = [],
  newSubtotal = 0,
  searchContainerRef,
  searchInputRef,
  searchQuery = '',
  setSearchQuery,
  isSearchOpen = false,
  setIsSearchOpen,
  filteredProducts = [],
  addNewProduct,
  expandedId,
  setExpandedId,
  barcodeInput = '',
  setBarcodeInput,
  handleAddBarcode,
  handleRemoveBarcode,
  updateNewItem,
  removeNewItem,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#1e293b',
          }}
        >
          2. Select Replacement / New Items to Issue
        </h4>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4338ca' }}>
          New Items Subtotal: {taka(newSubtotal)}
        </span>
      </div>

      {/* Product search bar */}
      <ExchangeProductSearch
        searchContainerRef={searchContainerRef}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        filteredProducts={filteredProducts}
        addNewProduct={addNewProduct}
      />

      {/* Replacement items table */}
      {newItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#94a3b8',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
          }}
        >
          No replacement items added yet. Use the search bar above to add items.
        </div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.84rem',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#4338ca',
                color: '#ffffff',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: '8px 10px' }}>Product</th>
              <th
                style={{
                  padding: '8px 10px',
                  textAlign: 'center',
                  width: '80px',
                }}
              >
                Warranty
              </th>
              <th
                style={{
                  padding: '8px 10px',
                  textAlign: 'center',
                  width: '80px',
                }}
              >
                Qty
              </th>
              <th
                style={{
                  padding: '8px 10px',
                  textAlign: 'right',
                  width: '110px',
                }}
              >
                Price
              </th>
              <th
                style={{
                  padding: '8px 10px',
                  textAlign: 'right',
                  width: '110px',
                }}
              >
                Total
              </th>
              <th style={{ padding: '8px 10px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {newItems.map((it) => (
              <ExchangeReplacementItemRow
                key={it.localId}
                it={it}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                barcodeInput={barcodeInput}
                setBarcodeInput={setBarcodeInput}
                handleAddBarcode={handleAddBarcode}
                handleRemoveBarcode={handleRemoveBarcode}
                updateNewItem={updateNewItem}
                removeNewItem={removeNewItem}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
