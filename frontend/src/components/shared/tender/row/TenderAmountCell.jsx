import React from 'react';
import { taka } from '../tenderPaymentUtils';

export default function TenderAmountCell({
  isLocked,
  row,
  index,
  rowError,
  onUpdateTender,
  onClearRowError,
}) {
  return (
    <td
      style={{
        padding: '4px 6px',
        width: '115px',
        minWidth: '100px',
        textAlign: 'right',
      }}
    >
      {isLocked ? (
        <span
          style={{
            fontWeight: 800,
            color: '#166534',
            fontSize: '0.82rem',
          }}
        >
          {taka(row.amount)}
        </span>
      ) : (
        <input
          type="number"
          min="0"
          step="any"
          placeholder="0.00"
          value={row.amount === '' ? '' : row.amount}
          onChange={(e) => {
            onUpdateTender(index, { amount: e.target.value });
            if (onClearRowError) onClearRowError(index);
          }}
          style={{
            width: '100%',
            height: '28px',
            padding: '2px 6px',
            borderRadius: '4px',
            border: rowError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
            fontSize: '0.80rem',
            fontWeight: 700,
            textAlign: 'right',
            boxSizing: 'border-box',
            outline: 'none',
            color: '#0f172a',
          }}
        />
      )}
    </td>
  );
}
