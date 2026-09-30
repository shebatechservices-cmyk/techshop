import React from 'react';

export default function QuotationCustomerMeta({
  customerId,
  customers,
  customerName,
  validUntil,
  onCustomerChange,
  onCustomerNameChange,
  onValidUntilChange,
  onOpenAddCustomer,
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '18px',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr',
        gap: '14px',
        alignItems: 'flex-end',
      }}
    >
      {/* Customer Select + Add Button */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
          Customer / Client
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select
            value={customerId}
            onChange={(e) => onCustomerChange(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="">-- Choose Registered Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (onOpenAddCustomer) onOpenAddCustomer();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #6366f1',
              background: '#eef2ff',
              color: '#4f46e5',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
            title="Add New Customer"
          >
            +
          </button>
        </div>
      </div>

      {/* Manual Client Name if Walk-in */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
          Client Name
        </label>
        <input
          type="text"
          placeholder="Walk-in / Company name"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.86rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Valid Until Date */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
          Valid Until
        </label>
        <input
          type="date"
          value={validUntil}
          onChange={(e) => onValidUntilChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.86rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
