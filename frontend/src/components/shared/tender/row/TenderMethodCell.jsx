import React from 'react';
import { getMethodIcon } from '../tenderPaymentUtils';

export default function TenderMethodCell({
  isLocked,
  row,
  index,
  effectivePaymentMethods = [],
  methodIcon,
  onMethodChange,
}) {
  return (
    <td style={{ padding: '4px 6px', minWidth: '135px' }}>
      {isLocked ? (
        <div
          style={{
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.76rem',
          }}
        >
          <span>{methodIcon}</span>
          <span>{row.method}</span>
        </div>
      ) : (
        <select
          value={
            row.method ||
            effectivePaymentMethods[0]?.account_name ||
            effectivePaymentMethods[0]?.name ||
            'Cash'
          }
          onChange={(e) => {
            const val = e.target.value;
            const matchMethod = effectivePaymentMethods.find(
              (pm) => (pm.account_name || pm.name || pm.method_name) === val
            );
            onMethodChange(index, val, matchMethod ? matchMethod.id : null);
          }}
          style={{
            width: '100%',
            height: '28px',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '0.76rem',
            background: '#ffffff',
            outline: 'none',
            color: '#1e293b',
            boxSizing: 'border-box',
          }}
        >
          {effectivePaymentMethods.map((pm) => {
            const accountName = pm.account_name || pm.name || pm.method_name;
            const icon = getMethodIcon(pm.account_type || pm.type, accountName);
            const suffix = pm.account_number ? ` (${pm.account_number})` : '';
            return (
              <option key={pm.id || accountName} value={accountName}>
                {icon} {accountName} {suffix}
              </option>
            );
          })}
          {!effectivePaymentMethods.some(
            (pm) =>
              (pm.account_name || pm.name || pm.method_name || '').toLowerCase() ===
              'wallet'
          ) && <option value="Wallet">👛 Wallet</option>}
        </select>
      )}
    </td>
  );
}
