import React from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

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
      <div
        ref={searchContainerRef}
        style={{ position: 'relative', marginBottom: '14px' }}
      >
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsSearchOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          placeholder="🔍 Search replacement products by name, brand, SKU or barcode..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1.5px solid #4338ca',
            fontSize: '0.88rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {isSearchOpen && filteredProducts.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: '4px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addNewProduct(p)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{fullCatalogName(p)}</strong>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: '#64748b',
                      marginLeft: '6px',
                    }}
                  >
                    Stock: {p.stock || 0}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>
                  {taka(
                    p.sale_price ??
                      p.salePrice ??
                      p.selling_price ??
                      p.purchase_price ??
                      0
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
            {newItems.map((it) => {
              const isSerialMissing =
                it.is_serial_tracked &&
                (!it.serials || it.serials.length === 0);
              const isWarrantyMissing =
                it.is_warranty_required &&
                (it.warranty_months === '' ||
                  it.warranty_months === null ||
                  Number(it.warranty_months) <= 0);
              const qty = it.is_serial_tracked
                ? (it.serials || []).length
                : Number(it.quantity || 1);
              const isExpanded = expandedId === it.localId;

              return (
                <React.Fragment key={it.localId}>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        {it.full_name || it.name}
                      </div>
                      {it.is_serial_tracked && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            marginTop: '4px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: isSerialMissing ? '#b91c1c' : '#4f46e5',
                              background: isSerialMissing
                                ? '#fef2f2'
                                : '#eef2ff',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 800,
                            }}
                          >
                            {isSerialMissing
                              ? '⚠️ Serial Required'
                              : 'Serial Tracked'}
                          </span>
                          {(it.serials || []).map((s, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: '0.68rem',
                                fontFamily: 'monospace',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '1px 5px',
                                borderRadius: '3px',
                              }}
                            >
                              {s}{' '}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveBarcode(it.localId, s)
                                }
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : it.localId)
                            }
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: isSerialMissing
                                ? '1.5px solid #ef4444'
                                : '1px dashed #cbd5e1',
                              background: isSerialMissing
                                ? '#fef2f2'
                                : '#f8fafc',
                              color: isSerialMissing ? '#dc2626' : '#4338ca',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            {isExpanded
                              ? '✕ Close'
                              : isSerialMissing
                              ? '⚠️ + Add Serial'
                              : '+ Barcode'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={
                          it.warranty_months !== undefined
                            ? it.warranty_months
                            : ''
                        }
                        onChange={(e) =>
                          updateNewItem(it.localId, {
                            warranty_months: e.target.value,
                          })
                        }
                        placeholder={it.is_warranty_required ? 'Req' : '0'}
                        style={{
                          width: '76px',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: isWarrantyMissing
                            ? '2px solid #ef4444'
                            : '1px solid #cbd5e1',
                          backgroundColor: isWarrantyMissing
                            ? '#fef2f2'
                            : '#ffffff',
                          color: isWarrantyMissing ? '#b91c1c' : '#1e293b',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {it.is_serial_tracked ? (
                        <input
                          type="number"
                          readOnly
                          value={qty}
                          title="Auto-calculated from serials count"
                          style={{
                            width: '76px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: isSerialMissing
                              ? '2px solid #ef4444'
                              : '1px solid #cbd5e1',
                            backgroundColor: isSerialMissing
                              ? '#fef2f2'
                              : '#f1f5f9',
                            color: isSerialMissing ? '#b91c1c' : '#475569',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        />
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={it.quantity || 1}
                          onChange={(e) =>
                            updateNewItem(it.localId, {
                              quantity: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            })
                          }
                          style={{
                            width: '76px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {taka(it.unit_price)}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontWeight: 700,
                      }}
                    >
                      {taka(qty * Number(it.unit_price || 0))}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeNewItem(it.localId)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '1rem',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = '#ef4444')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = '#94a3b8')
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          padding: '8px 12px',
                          background: '#f8fafc',
                          borderBottom: '1px dashed #cbd5e1',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#4338ca',
                            }}
                          >
                            📦 Scan Serial / Barcode:
                          </span>
                          <input
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBarcode(it.localId);
                              }
                            }}
                            placeholder="Scan barcode or enter serial number..."
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #818cf8',
                              fontSize: '0.82rem',
                              flex: 1,
                              maxWidth: '300px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddBarcode(it.localId)}
                            style={{
                              padding: '5px 10px',
                              background: '#4338ca',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
