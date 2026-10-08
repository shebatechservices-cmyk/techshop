import React from 'react';
import {
  money,
  taka,
  getMethodIcon,
  getMethodType,
  getAccountOptions,
  getAccountBalance,
  accountLabel,
} from './tenderPaymentUtils';

export default function TenderTableRow({
  row,
  index,
  totalRows,
  rowError,
  effectivePaymentMethods = [],
  allAccounts = [],
  bankAccounts = [],
  mfsAccounts = [],
  cashAccounts = [],
  isPurchase = false,
  walletBalance = 0,
  walletAccountLabel = '',
  onUpdateTender,
  onMethodChange,
  onAccept,
  onCancel,
  onClearRowError,
}) {
  const isLocked = Boolean(row.isAccepted);
  const accountOptions = getAccountOptions({
    method: row.method,
    effectivePaymentMethods,
    bankAccounts,
    mfsAccounts,
    cashAccounts,
    isPurchase,
    walletAccountLabel,
  });
  const isWallet =
    String(row.method).toLowerCase() === 'wallet' ||
    getMethodType(row.method, effectivePaymentMethods) === 'wallet';
  const effectiveSub =
    (isWallet
      ? accountOptions[0]
      : accountOptions.includes(row.sub_option)
      ? row.sub_option
      : accountOptions[0]) || '';
  const currentBal = getAccountBalance({
    method: row.method,
    subOption: effectiveSub,
    effectivePaymentMethods,
    walletBalance,
    bankAccounts,
    mfsAccounts,
    cashAccounts,
    isPurchase,
    walletAccountLabel,
    allAccounts,
  });
  const balLabel = isWallet ? 'Wallet:' : 'Avail:';
  const methodIcon = getMethodIcon(
    getMethodType(row.method, effectivePaymentMethods),
    row.method
  );

  return (
    <React.Fragment>
      <tr
        style={{
          borderBottom: index < totalRows - 1 ? '1px solid #f1f5f9' : 'none',
          background: isLocked ? '#f0fdf4' : index % 2 === 0 ? '#ffffff' : '#fafafa',
          transition: 'background 0.15s ease',
        }}
      >
        {/* Sl. */}
        <td
          style={{
            padding: '4px 6px',
            textAlign: 'center',
            fontWeight: 700,
            color: isLocked ? '#166534' : '#64748b',
            fontSize: '0.74rem',
          }}
        >
          {index + 1}
        </td>

        {/* Payment Method */}
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

        {/* Account with live balance display */}
        <td style={{ padding: '4px 6px', minWidth: '145px' }}>
          {isLocked ? (
            <div>
              <div
                style={{
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  lineHeight: 1.2,
                }}
              >
                {effectiveSub || '(Default Account)'}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  marginTop: '1px',
                  fontSize: '0.64rem',
                  lineHeight: 1.1,
                }}
              >
                <span
                  style={{
                    color: isWallet ? '#7e22ce' : '#64748b',
                    fontWeight: 600,
                  }}
                >
                  {balLabel}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0px 4px',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    background: isWallet
                      ? currentBal > 0
                        ? '#faf5ff'
                        : '#f8fafc'
                      : currentBal > 0
                      ? '#f0fdf4'
                      : currentBal < 0
                      ? '#fef2f2'
                      : '#f8fafc',
                    color: isWallet
                      ? currentBal > 0
                        ? '#7e22ce'
                        : '#64748b'
                      : currentBal > 0
                      ? '#15803d'
                      : currentBal < 0
                      ? '#dc2626'
                      : '#64748b',
                    border: `1px solid ${
                      isWallet
                        ? currentBal > 0
                          ? '#f3e8ff'
                          : '#e2e8f0'
                        : currentBal > 0
                        ? '#bbf7d0'
                        : currentBal < 0
                        ? '#fecaca'
                        : '#e2e8f0'
                    }`,
                  }}
                >
                  {taka(currentBal)}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <select
                value={effectiveSub}
                disabled={isWallet}
                onChange={(e) =>
                  onUpdateTender(index, { sub_option: e.target.value })
                }
                style={{
                  width: '100%',
                  height: '28px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: isWallet ? '1px solid #e9d5ff' : '1px solid #cbd5e1',
                  fontSize: '0.76rem',
                  background: isWallet ? '#faf5ff' : '#ffffff',
                  outline: 'none',
                  color: isWallet ? '#7e22ce' : '#1e293b',
                  fontWeight: 600,
                  cursor: isWallet ? 'default' : 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {accountOptions.map((acc) => {
                  const balSuffix = isWallet
                    ? ` (${taka(walletBalance)})`
                    : (() => {
                        const match = (allAccounts || []).find(
                          (a) => accountLabel(a) === acc || a.name === acc
                        );
                        return match &&
                          match.balance !== undefined &&
                          match.balance !== null
                          ? ` (${taka(match.balance)})`
                          : '';
                      })();
                  return (
                    <option key={acc} value={acc}>
                      {acc}
                      {balSuffix}
                    </option>
                  );
                })}
              </select>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  marginTop: '1px',
                  fontSize: '0.64rem',
                  lineHeight: 1.1,
                }}
              >
                <span
                  style={{
                    color: isWallet ? '#7e22ce' : '#64748b',
                    fontWeight: 600,
                  }}
                >
                  {balLabel}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0px 4px',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    background: isWallet
                      ? currentBal > 0
                        ? '#faf5ff'
                        : '#f8fafc'
                      : currentBal > 0
                      ? '#f0fdf4'
                      : currentBal < 0
                      ? '#fef2f2'
                      : '#f8fafc',
                    color: isWallet
                      ? currentBal > 0
                        ? '#7e22ce'
                        : '#64748b'
                      : currentBal > 0
                      ? '#15803d'
                      : currentBal < 0
                      ? '#dc2626'
                      : '#64748b',
                    border: `1px solid ${
                      isWallet
                        ? currentBal > 0
                          ? '#f3e8ff'
                          : '#e2e8f0'
                        : currentBal > 0
                        ? '#bbf7d0'
                        : currentBal < 0
                        ? '#fecaca'
                        : '#e2e8f0'
                    }`,
                  }}
                >
                  {taka(currentBal)}
                </span>
              </div>
            </div>
          )}
        </td>

        {/* Ref / Trans. ID */}
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
              placeholder={
                getMethodType(row.method, effectivePaymentMethods) === 'bank'
                  ? 'Cheque/Ref#'
                  : getMethodType(row.method, effectivePaymentMethods) === 'cash'
                  ? 'Memo/Ref'
                  : isWallet
                  ? 'Note'
                  : 'TrxID'
              }
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

        {/* Amount */}
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

        {/* Action */}
        <td style={{ padding: '4px 6px', width: '70px', textAlign: 'center' }}>
          {isLocked ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
                title="Payment Accepted"
              >
                ✓
              </span>
              <button
                type="button"
                onClick={() => onCancel(index)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#dc2626',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Remove this payment entry"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => onAccept(index)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(22, 163, 74, 0.25)',
                }}
                title="Accept / Confirm payment"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => onCancel(index)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Cancel / Remove row"
              >
                ✕
              </button>
            </div>
          )}
        </td>
      </tr>
      {rowError && (
        <tr style={{ background: '#fef2f2' }}>
          <td
            colSpan={6}
            style={{
              padding: '3px 8px',
              color: '#dc2626',
              fontSize: '0.70rem',
              fontWeight: 600,
            }}
          >
            ⚠️ {rowError}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
