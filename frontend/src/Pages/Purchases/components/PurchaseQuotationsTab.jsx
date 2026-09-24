import React from 'react';

export default function PurchaseQuotationsTab({
  quotations,
  filteredQuotations,
  loading,
  searchQuery,
  setSearchQuery,
  loadAllData,
  setIsQuotationModalOpen,
  handleEditQuotation,
  handleDeleteQuotation,
  handleUpdateQuotationStatus,
  getQuotationBadgeStyle,
  totalQuotationAmount,
}) {
  return (
    <div>
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Quotation Volume
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#4f46e5', fontWeight: 800 }}>
            ৳ {totalQuotationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Quotes
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
            {quotations.length}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Approved
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
            {quotations.filter((q) => q.status === 'approved').length}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Pending Review
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#d97706', fontWeight: 800 }}>
            {quotations.filter((q) => q.status === 'draft' || q.status === 'pending').length}
          </h3>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quotation no, supplier..."
          style={{
            maxWidth: '300px',
            width: '100%',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <button
          onClick={loadAllData}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#475569',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading purchase quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No purchase quotations found</p>
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              style={{
                marginTop: '12px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Create First Quotation
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>Quotation #</th>
                  <th style={{ padding: '12px 16px' }}>Supplier</th>
                  <th style={{ padding: '12px 16px' }}>Reference</th>
                  <th style={{ padding: '12px 16px' }}>Quote Date</th>
                  <th style={{ padding: '12px 16px' }}>Valid Until</th>
                  <th style={{ padding: '12px 16px' }}>Items</th>
                  <th style={{ padding: '12px 16px' }}>Total Amount</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => (
                  <tr key={quote.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>
                      {quote.quotation_no}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 600 }}>
                      <div>{quote.supplier_name || `Supplier #${quote.supplier_id}`}</div>
                      {quote.supplier_phone && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{quote.supplier_phone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {quote.reference || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                      {quote.quotation_date ? new Date(quote.quotation_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Open'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {quote.item_count || 0} Units
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      ৳ {Number(quote.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={quote.status || 'draft'}
                        onChange={(e) => handleUpdateQuotationStatus(quote.id, e.target.value)}
                        style={{
                          ...getQuotationBadgeStyle(quote.status),
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="ordered">Ordered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleEditQuotation(quote.id)}
                        style={{
                          background: '#fffbeb',
                          color: '#d97706',
                          border: '1px solid #fde68a',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginRight: '6px',
                        }}
                        title="Edit this quotation"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuotation(quote.id)}
                        style={{
                          background: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Delete this quotation"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
