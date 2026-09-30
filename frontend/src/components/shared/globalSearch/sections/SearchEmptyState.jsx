import React from 'react';

export default function SearchEmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>
        No records found matching "{query}"
      </p>
      <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: 0 }}>
        Try searching with an invoice number, customer/supplier name, phone, or product keyword.
      </p>
    </div>
  );
}
