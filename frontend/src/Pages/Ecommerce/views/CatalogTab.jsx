import React from 'react';

export default function CatalogTab({
  filteredCatalog,
  catalogSearch,
  setCatalogSearch,
  catalogStockFilter,
  setCatalogStockFilter,
  setIsNewOrderModalOpen,
  taka,
}) {
  return (
    <div>
      {/* Catalog Filter Header */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="🔍 Search catalog by product name, SKU, brand..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={catalogStockFilter}
            onChange={(e) => setCatalogStockFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="all">All Stock Statuses</option>
            <option value="instock">In Stock (Stock &gt; 0)</option>
            <option value="lowstock">Low Stock (Stock ≤ 5)</option>
            <option value="outofstock">Out of Stock</option>
          </select>

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            + Create Order with Product
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {filteredCatalog.map((p) => {
          const stock = Number(p.stock || 0);
          const isOut = stock <= 0;
          const isLow = stock > 0 && stock <= 5;

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
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <div>
                {/* Header: SKU & Stock Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    SKU: {p.sku || 'N/A'}
                  </span>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                      color: isOut ? '#b91c1c' : isLow ? '#b45309' : '#15803d',
                    }}
                  >
                    {isOut ? 'Out of Stock' : isLow ? `Low (${stock})` : `In Stock (${stock})`}
                  </span>
                </div>

                {/* Product Name */}
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', lineHeight: '1.3', marginBottom: '6px' }}>
                  {p.name}
                </div>

                {p.brand_name && (
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '8px' }}>
                    Brand: <strong>{p.brand_name}</strong>
                  </div>
                )}
              </div>

              {/* Pricing & Action */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Selling Price</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a' }}>
                    {taka(p.selling_price || p.purchase_price || 0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(true)}
                  style={{
                    padding: '6px 10px',
                    background: '#f0fdfa',
                    border: '1px solid #99f6e4',
                    color: '#0d9488',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Order
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
