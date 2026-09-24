import React from 'react';

export default function StorefrontView({
  filteredProducts,
  storeSearch,
  setStoreSearch,
  cart,
  addToCart,
  updateCartQty,
  setActiveView,
  taka,
}) {
  return (
    <div>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
          borderRadius: '12px',
          padding: '24px 30px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(13, 148, 136, 0.2)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
            Genuine Security Cameras &amp; Networking Gear
          </h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.88rem' }}>
            Fast delivery across all 64 districts with Cash on Delivery (Steadfast &amp; Pathao)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('track')}
          style={{
            padding: '9px 18px',
            background: '#ffffff',
            color: '#065f46',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          📦 Track Existing Order
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          placeholder="🔍 Search security products, routers, cameras by name..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
            background: '#ffffff',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Product Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredProducts.map((p) => {
          const price = Number(p.selling_price || p.purchase_price || 0);
          const stock = Number(p.stock || 0);
          const inCart = cart.find((it) => it.product_id === p.id);

          return (
            <div
              key={p.id}
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    SKU: {p.sku || 'N/A'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: stock > 0 ? '#dcfce7' : '#fee2e2',
                      color: stock > 0 ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
                  </span>
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    marginBottom: '6px',
                    lineHeight: '1.3',
                  }}
                >
                  {p.name}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '10px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: '#0d9488',
                    marginBottom: '8px',
                  }}
                >
                  {taka(price)}
                </div>

                {inCart ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f0fdfa',
                      border: '1px solid #99f6e4',
                      borderRadius: '6px',
                      padding: '4px 8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => updateCartQty(p.id, -1)}
                      style={{
                        border: 'none',
                        background: 'none',
                        fontWeight: 800,
                        color: '#0d9488',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontWeight: 800,
                        color: '#0f766e',
                        fontSize: '0.85rem',
                      }}
                    >
                      {inCart.quantity} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(p.id, 1)}
                      style={{
                        border: 'none',
                        background: 'none',
                        fontWeight: 800,
                        color: '#0d9488',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
