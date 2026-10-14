import React from 'react';
import { getMethodType } from '../tenderPaymentUtils';

export default function TenderTrxCell({
  isLocked,
  isWallet,
  row,
  index,
  effectivePaymentMethods = [],
  onUpdateTender,
}) {
  const methodType = getMethodType(row.method, effectivePaymentMethods);
  const placeholder =
    methodType === 'bank'
      ? 'Cheque/Ref#'
      : methodType === 'cash'
      ? 'Memo/Ref'
      : isWallet
      ? 'Note'
      : 'TrxID';

  return (
    <td style={{ padding: '4px 6px', width: '120px', minWidth: '105px' }}>
      {isLocked ? (
        <span
          style={{
            color: row.transaction_id ? '#0f172a' : '#94a3b8',
            fontFamily: 'monospace',
            fontSize: '0.74rem',
          }}
        >
          {row.transaction_id || '—'}
        </span>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={row.transaction_id || ''}
          onChange={(e) =>
            onUpdateTender(index, { transaction_id: e.target.value })
          }
          style={{
            width: '100%',
            height: '28px',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '0.76rem',
            boxSizing: 'border-box',
            outline: 'none',
            color: '#1e293b',
          }}
        />
      )}
    </td>
  );
}
