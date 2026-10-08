import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExchangeReturnItemsTable({
  returnItems = [],
  setReturnItems,
  returnSubtotal = 0,
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
          1. Select Items to Return (Restock & Credit)
        </h4>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
          Total Return Credit: {taka(returnSubtotal)}
        </span>
      </div>

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
              background: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              color: '#475569',
              textAlign: 'left',
            }}
          >
            <th style={{ padding: '8px 10px', width: '40px' }}>Return?</th>
            <th style={{ padding: '8px 10px' }}>Product</th>
            <th
              style={{
                padding: '8px 10px',
                textAlign: 'center',
                width: '90px',
              }}
            >
              Return Qty
            </th>
            <th
              style={{
                padding: '8px 10px',
                textAlign: 'right',
                width: '110px',
              }}
            >
              Unit Credit
            </th>
            <th
              style={{
                padding: '8px 10px',
                textAlign: 'center',
                width: '120px',
              }}
            >
              Condition
            </th>
            <th
              style={{
                padding: '8px 10px',
                textAlign: 'right',
                width: '120px',
              }}
            >
              Total Credit
            </th>
          </tr>
        </thead>
        <tbody>
          {returnItems.map((r, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: '1px solid #f1f5f9',
                background: r.is_selected ? '#f8fafc' : '#ffffff',
              }}
            >
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={r.is_selected}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setReturnItems((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, is_selected: checked } : it
                      )
                    );
                  }}
                />
              </td>
              <td style={{ padding: '8px 10px' }}>
                <strong>{r.name}</strong>
                {r.serials && r.serials.length > 0 && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      fontFamily: 'monospace',
                    }}
                  >
                    S/N: {r.serials.join(', ')}
                  </div>
                )}
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max={r.original_qty}
                  disabled={!r.is_selected}
                  value={r.return_qty}
                  onChange={(e) => {
                    const val = Math.min(
                      r.original_qty,
                      Math.max(1, parseInt(e.target.value) || 1)
                    );
                    setReturnItems((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, return_qty: val } : it
                      )
                    );
                  }}
                  style={{
                    width: '50px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'center',
                  }}
                />
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                {taka(r.unit_price)}
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                <select
                  disabled={!r.is_selected}
                  value={r.condition}
                  onChange={(e) => {
                    const cond = e.target.value;
                    setReturnItems((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, condition: cond } : it
                      )
                    );
                  }}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="Good">Good (Restock)</option>
                  <option value="Damaged">Damaged (Quarantine)</option>
                </select>
              </td>
              <td
                style={{
                  padding: '8px 10px',
                  textAlign: 'right',
                  fontWeight: 700,
                  color: '#059669',
                }}
              >
                {r.is_selected ? taka(r.return_qty * r.unit_price) : taka(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
