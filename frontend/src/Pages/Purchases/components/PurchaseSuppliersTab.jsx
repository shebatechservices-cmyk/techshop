import React from 'react';

export default function PurchaseSuppliersTab({
  suppliers,
  filteredSuppliers,
  loading,
  searchQuery,
  setSearchQuery,
  loadAllData,
  setIsSupplierModalOpen,
  setProfileModalPartyId,
  setProfileModalTab,
  handleDeleteSupplier,
  totalSupplierDue,
}) {
  return (
    <div>
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Suppliers
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#059669', fontWeight: 800 }}>
            {suppliers.length}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Outstanding Due
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: totalSupplierDue > 0 ? '#ef4444' : '#16a34a', fontWeight: 800 }}>
            ৳ {totalSupplierDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Pending Balance
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#d97706', fontWeight: 800 }}>
            {suppliers.filter((s) => Number(s.payable_balance) > 0).length}
          </h3>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by supplier name, phone..."
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
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No suppliers found</p>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              style={{
                marginTop: '12px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add First Supplier
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>Supplier / Company</th>
                  <th style={{ padding: '12px 16px' }}>Contact Person</th>
                  <th style={{ padding: '12px 16px' }}>Phone / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px' }}>Address</th>
                  <th style={{ padding: '12px 16px' }}>Payable Due</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalPartyId(s.id);
                          setProfileModalTab('overview');
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          fontWeight: 700,
                          color: '#0f172a',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.92rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#059669')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {s.name}
                      </button>
                      {s.contact_code && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Code: {s.contact_code}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>
                      {s.contact_person || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      <div>{s.phone || '—'}</div>
                      {s.mobile && s.mobile !== s.phone && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.mobile}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {s.email || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.address || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <strong style={{ fontWeight: 700, color: Number(s.payable_balance) > 0 ? '#ef4444' : '#16a34a' }}>
                        ৳ {Number(s.payable_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {Number(s.payable_balance) > 0 ? 'Payable Due' : Number(s.payable_balance) < 0 ? 'Advance Given (Credit)' : 'Cleared'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileModalPartyId(s.id);
                            setProfileModalTab('overview');
                          }}
                          style={{
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="View supplier profile & ledger"
                        >
                          <span>👤</span> Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id)}
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
                          title="Delete this supplier"
                        >
                          🗑️ Delete
                        </button>
                      </div>
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
