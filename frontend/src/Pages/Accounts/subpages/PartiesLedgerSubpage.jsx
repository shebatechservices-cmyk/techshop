import React from 'react';

export default function PartiesLedgerSubpage({
  parties = [],
  partyCounts = { total: 0, customer: 0, supplier: 0, staff: 0 },
  partyTypeFilter = 'all',
  setPartyTypeFilter,
  partySearch = '',
  setPartySearch,
  partyPage = 1,
  setPartyPage,
  partyPagination = { total: 0, page: 1, limit: 20, totalPages: 1 },
  loadingParties = false,
  onOpenPartyModal,
  onRefresh,
}) {
  return (
    <div>
      {/* Top Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {/* Filter Pills in #f1f5f9 container */}
        <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          {[
            { id: 'all', label: 'All Parties', count: partyCounts.total },
            { id: 'customer', label: 'Customers', count: partyCounts.customer },
            { id: 'supplier', label: 'Suppliers', count: partyCounts.supplier },
            { id: 'staff', label: 'Staff & Team', count: partyCounts.staff },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setPartyTypeFilter(f.id);
                setPartyPage(1);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: partyTypeFilter === f.id ? '#0284c7' : 'transparent',
                color: partyTypeFilter === f.id ? '#ffffff' : '#64748b',
                fontWeight: partyTypeFilter === f.id ? 700 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: partyTypeFilter === f.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{f.label}</span>
              <span
                style={{
                  background: partyTypeFilter === f.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: partyTypeFilter === f.id ? '#ffffff' : '#475569',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {f.count || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text"
            placeholder="Search by name, phone, email, role..."
            value={partySearch}
            onChange={(e) => {
              setPartySearch(e.target.value);
              setPartyPage(1);
            }}
            style={{
              width: '240px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#ffffff',
            }}
          />
          {partySearch && (
            <button
              type="button"
              onClick={() => {
                setPartySearch('');
                setPartyPage(1);
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh List"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Party Table Container */}
      <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loadingParties ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>Loading party profiles...</div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Fetching live party balances and ledger histories</span>
          </div>
        ) : parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>👥</div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>No profiles found</h4>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              {partySearch
                ? `No matching party for "${partySearch}"`
                : 'No party profiles registered in this category yet.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  <th style={{ padding: '8px 12px' }}>Party Name</th>
                  <th style={{ padding: '8px 12px' }}>Classification</th>
                  <th style={{ padding: '8px 12px' }}>Contact Details</th>
                  <th style={{ padding: '8px 12px' }}>Address</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Current Balance</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Audit Records</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((p) => {
                  const bal = parseFloat(p.balance || 0);
                  const isCust = p.party_type === 'customer';
                  const isSupp = p.party_type === 'supplier';
                  const isStaff = p.party_type === 'staff';

                  const badgeClasses = isCust
                    ? { bg: '#eff6ff', text: '#0284c7', border: '#bfdbfe', avatarBg: '#dbeafe', avatarText: '#0369a1', label: 'Customer' }
                    : isSupp
                    ? { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', avatarBg: '#d1fae5', avatarText: '#047857', label: 'Supplier' }
                    : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', avatarBg: '#ede9fe', avatarText: '#6d28d9', label: 'Staff' };

                  return (
                    <tr key={`${p.party_type}-${p.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Name & Avatar */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              background: badgeClasses.avatarBg,
                              color: badgeClasses.avatarText,
                              flexShrink: 0,
                            }}
                          >
                            {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenPartyModal(p.party_type, p.id, 'overview')}
                              style={{
                                fontWeight: 700,
                                color: '#0f172a',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.86rem',
                                textAlign: 'left',
                              }}
                            >
                              {p.name}
                            </button>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{p.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Classification */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: badgeClasses.bg,
                              color: badgeClasses.text,
                              border: `1px solid ${badgeClasses.border}`,
                            }}
                          >
                            {badgeClasses.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {p.role_or_type || 'Standard'}
                          </span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>{p.phone || '—'}</div>
                        {p.email && <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{p.email}</div>}
                      </td>

                      {/* Address */}
                      <td
                        style={{ padding: '8px 12px', color: '#475569', fontSize: '0.78rem', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={p.address || ''}
                      >
                        {p.address || '—'}
                      </td>

                      {/* Current Balance */}
                      <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isStaff ? (
                          <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            Active User
                          </span>
                        ) : (
                          <div>
                            <strong
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                color: bal > 0 ? (isCust ? '#dc2626' : '#d97706') : bal < 0 ? '#16a34a' : '#0f172a',
                              }}
                            >
                              ৳ {bal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              {bal > 0
                                ? isCust ? 'Receivable Due' : 'Payable Due'
                                : bal < 0 ? 'Advance (Credit)' : 'Cleared'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Audit Records */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: p.activity_count > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            background: p.activity_count > 0 ? '#ecfdf5' : '#f8fafc',
                            color: p.activity_count > 0 ? '#065f46' : '#94a3b8',
                          }}
                        >
                          {p.activity_count > 0 ? `✓ ${p.activity_count}` : '0 records'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onOpenPartyModal(p.party_type, p.id, 'overview')}
                            title="View Complete Profile & Ledger"
                            style={{
                              padding: '3px 8px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              color: '#334155',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            👤 Profile
                          </button>
                          {!isStaff && (
                            <button
                              type="button"
                              onClick={() => onOpenPartyModal(p.party_type, p.id, 'financial')}
                              title={isCust ? 'Receive Due Payment' : 'Pay Due to Supplier'}
                              style={{
                                padding: '3px 8px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '5px',
                                color: '#0369a1',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              💳 Pay / Due
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenPartyModal(p.party_type, p.id, 'edit')}
                            title="Edit Profile Details"
                            style={{
                              padding: '3px 8px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              color: '#475569',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPartyModal(p.party_type, p.id, 'activity')}
                            title="Delete Check"
                            style={{
                              padding: '3px 8px',
                              background: '#ffffff',
                              border: '1px solid #fca5a5',
                              borderRadius: '5px',
                              color: '#dc2626',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {partyPagination.totalPages > 1 && (
          <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Showing page <strong style={{ color: '#0f172a' }}>{partyPage}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{partyPagination.totalPages}</strong> (
              {partyPagination.total} total parties)
            </span>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={partyPage <= 1}
                onClick={() => setPartyPage((prev) => Math.max(1, prev - 1))}
                style={{
                  padding: '4px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '5px',
                  fontSize: '0.75rem',
                  color: partyPage <= 1 ? '#cbd5e1' : '#334155',
                  cursor: partyPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                « Prev
              </button>

              {Array.from({ length: Math.min(5, partyPagination.totalPages) }, (_, i) => {
                let startPage = Math.max(1, partyPage - 2);
                if (startPage + 4 > partyPagination.totalPages) {
                  startPage = Math.max(1, partyPagination.totalPages - 4);
                }
                const pg = startPage + i;
                if (pg > partyPagination.totalPages) return null;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPartyPage(pg)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: pg === partyPage ? '#0284c7' : '#ffffff',
                      color: pg === partyPage ? '#ffffff' : '#475569',
                      boxShadow: pg === partyPage ? '0 1px 3px rgba(2, 132, 199, 0.25)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {pg}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={partyPage >= partyPagination.totalPages}
                onClick={() => setPartyPage((prev) => Math.min(partyPagination.totalPages, prev + 1))}
                style={{
                  padding: '4px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '5px',
                  fontSize: '0.75rem',
                  color: partyPage >= partyPagination.totalPages ? '#cbd5e1' : '#334155',
                  cursor: partyPage >= partyPagination.totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
