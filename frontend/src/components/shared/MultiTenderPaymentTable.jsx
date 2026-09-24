import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getMethodIcon = (type, name) => {
  const t = String(type || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (t === 'cash' || n === 'cash') return '💵';
  if (t === 'bank' || n.includes('bank')) return '🏦';
  if (t === 'wallet' || n.includes('wallet')) return '👛';
  if (
    t === 'mobile_banking' ||
    t === 'mfs' ||
    n.includes('bkash') ||
    n.includes('nagad') ||
    n.includes('rocket') ||
    n.includes('mfs') ||
    n.includes('cellfin') ||
    n.includes('upay')
  ) {
    return '📱';
  }
  if (t === 'card' || n.includes('card') || n.includes('pos')) return '💳';
  return '💳';
};

/**
 * MultiTenderPaymentTable
 *
 * Props:
 * - tenders: Array of tender objects:
 *     { id, method, payment_method_id, sub_option, transaction_id, receiver_name, amount, isAccepted }
 * - onUpdateTender: (index, patch) => void
 * - onAddTender: () => void
 * - onAcceptTender: (index) => void
 * - onCancelTender: (index) => void
 * - paymentMethods: Array of database payment methods [{id, name, type, account_number, is_active}]
 * - cashAccounts: Array of string labels
 * - bankAccounts: Array of string labels
 * - mfsAccounts: Array of string labels
 * - walletAccounts: Array of raw account objects (for balance lookup)
 * - isPurchase: boolean (false for Sale, true for Purchase)
 * - walletBalance: number (Customer advance or Supplier wallet balance)
 * - remainingPayable: number (for suggestion / validation)
 */
export default function MultiTenderPaymentTable({
  tenders = [],
  onUpdateTender,
  onAddTender,
  onAcceptTender,
  onCancelTender,
  paymentMethods: paymentMethodsProp = [],
  cashAccounts = [],
  bankAccounts = [],
  mfsAccounts = [],
  walletAccounts = [],
  financialAccounts = [],
  isPurchase = false,
  walletBalance = 0,
  walletAccountLabel = '',
  remainingPayable = 0,
}) {
  const [rowErrors, setRowErrors] = useState({});
  const [dbPaymentMethods, setDbPaymentMethods] = useState(paymentMethodsProp || []);

  useEffect(() => {
    if (paymentMethodsProp && paymentMethodsProp.length > 0) {
      setDbPaymentMethods(paymentMethodsProp);
      return;
    }
    const fetchActiveMethods = async () => {
      try {
        const res = await fetch(`${API}/accounts/payment-methods?active_only=true`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setDbPaymentMethods(data.data);
        }
      } catch (_) {
        // Fallback default methods
      }
    };
    fetchActiveMethods();
  }, [paymentMethodsProp]);

  // Combined active methods list (always include fallback defaults if empty)
  const effectivePaymentMethods = dbPaymentMethods.length > 0
    ? dbPaymentMethods
    : [
        { id: 1, name: 'Cash', type: 'cash', is_active: true },
        { id: 2, name: 'bKash', type: 'mobile_banking', is_active: true },
        { id: 3, name: 'Nagad', type: 'mobile_banking', is_active: true },
        { id: 4, name: 'Rocket', type: 'mobile_banking', is_active: true },
        { id: 5, name: 'Bank Transfer', type: 'bank', is_active: true },
      ];

  const allAccounts = financialAccounts.length > 0 ? financialAccounts : walletAccounts;

  const getMethodType = (methodName) => {
    const found = effectivePaymentMethods.find(
      (pm) => (pm.name || pm.method_name || '').toLowerCase() === String(methodName || '').toLowerCase()
    );
    if (found && found.type) return found.type.toLowerCase();
    const m = String(methodName || '').toLowerCase();
    if (m === 'wallet') return 'wallet';
    if (m.includes('bank')) return 'bank';
    if (m.includes('bkash') || m.includes('nagad') || m.includes('rocket') || m.includes('mfs') || m.includes('mobile')) return 'mobile_banking';
    if (m.includes('card')) return 'card';
    return 'cash';
  };

  const getAccountOptions = (method) => {
    const type = getMethodType(method);
    switch (type) {
      case 'bank':
        return bankAccounts.length > 0 ? bankAccounts : ['Bank Account'];
      case 'mobile_banking':
      case 'mfs':
        return mfsAccounts.length > 0 ? mfsAccounts : ['Mobile Banking Account'];
      case 'wallet': {
        const defLabel = isPurchase
          ? (walletAccountLabel || 'Supplier Wallet')
          : (walletAccountLabel || 'Customer Wallet');
        return [defLabel];
      }
      case 'cash':
      default:
        return cashAccounts.length > 0 ? cashAccounts : ['Cash Drawer'];
    }
  };

  const accountLabel = (a) => a.name + (a.account_number ? ` (${a.account_number})` : '');

  const getAccountBalance = (method, subOption) => {
    if (String(method).toLowerCase() === 'wallet' || getMethodType(method) === 'wallet') {
      return money(walletBalance);
    }
    const defaultAccounts = getAccountOptions(method);
    const effectiveSub = (defaultAccounts.includes(subOption) ? subOption : defaultAccounts[0]) || '';
    const match = (allAccounts || []).find((a) => {
      const label = accountLabel(a);
      return label === effectiveSub || a.name === effectiveSub;
    });
    if (match && match.balance !== undefined && match.balance !== null) {
      return money(match.balance);
    }
    return 0;
  };

  const handleMethodChange = (index, newMethodName, newMethodId) => {
    const defaultAccounts = getAccountOptions(newMethodName);
    const defaultAccount = defaultAccounts[0] || '';
    onUpdateTender(index, {
      method: newMethodName,
      payment_method_id: newMethodId || null,
      sub_option: defaultAccount,
      transaction_id: '',
    });
    setRowErrors((prev) => ({ ...prev, [index]: null }));
  };

  const handleAccept = (index) => {
    const row = tenders[index];
    const amt = money(row?.amount);
    if (amt <= 0) {
      setRowErrors((prev) => ({
        ...prev,
        [index]: 'Please enter an amount greater than 0',
      }));
      return;
    }

    if (String(row.method).toLowerCase() === 'wallet' || getMethodType(row.method) === 'wallet') {
      const availWallet = money(walletBalance);
      if (availWallet <= 0) {
        setRowErrors((prev) => ({
          ...prev,
          [index]: `Selected ${isPurchase ? 'supplier' : 'customer'} has no available wallet balance (৳0.00)`,
        }));
        return;
      }
      if (amt > availWallet) {
        setRowErrors((prev) => ({
          ...prev,
          [index]: `Payment amount (${taka(amt)}) exceeds available wallet balance (${taka(availWallet)})`,
        }));
        return;
      }
    }

    setRowErrors((prev) => ({ ...prev, [index]: null }));
    onAcceptTender(index);
  };

  const handleCancel = (index) => {
    setRowErrors((prev) => ({ ...prev, [index]: null }));
    onCancelTender(index);
  };

  return (
    <div style={{ width: '100%', marginTop: '8px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            💳 Payment Details (Multi-Tender)
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              color: '#15803d',
              background: '#dcfce7',
              padding: '1px 6px',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            {tenders.filter((t) => t.isAccepted).length} of {tenders.length} Accepted
          </span>
        </div>

        <button
          type="button"
          onClick={onAddTender}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px dashed #0284c7',
            background: '#f0f9ff',
            color: '#0284c7',
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            lineHeight: 1.2,
          }}
          title="Add another tender payment entry"
        >
          <span>＋</span> Add more
        </button>
      </div>

      {/* Table Container */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          overflowX: 'auto',
          background: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.76rem',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '5px 6px', width: '28px', textAlign: 'center', fontWeight: 700 }}>#</th>
              <th style={{ padding: '5px 6px', minWidth: '135px', fontWeight: 700 }}>Payment Method</th>
              <th style={{ padding: '5px 6px', minWidth: '145px', fontWeight: 700 }}>Account</th>
              <th style={{ padding: '5px 6px', width: '120px', minWidth: '105px', fontWeight: 700 }}>Ref:/Trans. ID</th>
              <th style={{ padding: '5px 6px', width: '115px', minWidth: '100px', textAlign: 'right', fontWeight: 700 }}>Amount (৳)</th>
              <th style={{ padding: '5px 6px', width: '70px', textAlign: 'center', fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tenders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    fontSize: '0.74rem',
                  }}
                >
                  No payment entries. Click <strong>"+ Add more"</strong> to record payment or leave empty for full due.
                </td>
              </tr>
            ) : (
              tenders.map((row, index) => {
                const isLocked = Boolean(row.isAccepted);
                const rowError = rowErrors[index];
                const accountOptions = getAccountOptions(row.method);
                const isWallet = String(row.method).toLowerCase() === 'wallet' || getMethodType(row.method) === 'wallet';
                const effectiveSub = (isWallet
                  ? accountOptions[0]
                  : (accountOptions.includes(row.sub_option) ? row.sub_option : accountOptions[0])) || '';
                const currentBal = getAccountBalance(row.method, effectiveSub);
                const balLabel = isWallet ? 'Wallet:' : 'Avail:';
                const methodIcon = getMethodIcon(getMethodType(row.method), row.method);

                return (
                  <React.Fragment key={row.id || index}>
                    <tr
                      style={{
                        borderBottom: index < tenders.length - 1 ? '1px solid #f1f5f9' : 'none',
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
                          <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                            <span>{methodIcon}</span>
                            <span>{row.method}</span>
                          </div>
                        ) : (
                          <select
                            value={row.method || (effectivePaymentMethods[0]?.name || 'Cash')}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchMethod = effectivePaymentMethods.find(
                                (pm) => (pm.name || pm.method_name) === val
                              );
                              handleMethodChange(index, val, matchMethod ? matchMethod.id : null);
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
                              const name = pm.name || pm.method_name;
                              const icon = getMethodIcon(pm.type, name);
                              const suffix = pm.account_number ? ` (${pm.account_number})` : '';
                              return (
                                <option key={pm.id || name} value={name}>
                                  {icon} {name} {suffix}
                                </option>
                              );
                            })}
                            {!effectivePaymentMethods.some((pm) => (pm.name || pm.method_name || '').toLowerCase() === 'wallet') && (
                              <option value="Wallet">👛 Wallet</option>
                            )}
                          </select>
                        )}
                      </td>

                      {/* Account with live balance display */}
                      <td style={{ padding: '4px 6px', minWidth: '145px' }}>
                        {isLocked ? (
                          <div>
                            <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.76rem', lineHeight: 1.2 }}>
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
                              <span style={{ color: isWallet ? '#7e22ce' : '#64748b', fontWeight: 600 }}>{balLabel}</span>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0px 4px',
                                  borderRadius: '3px',
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  background: isWallet ? (currentBal > 0 ? '#faf5ff' : '#f8fafc') : (currentBal > 0 ? '#f0fdf4' : currentBal < 0 ? '#fef2f2' : '#f8fafc'),
                                  color: isWallet ? (currentBal > 0 ? '#7e22ce' : '#64748b') : (currentBal > 0 ? '#15803d' : currentBal < 0 ? '#dc2626' : '#64748b'),
                                  border: `1px solid ${isWallet ? (currentBal > 0 ? '#f3e8ff' : '#e2e8f0') : (currentBal > 0 ? '#bbf7d0' : currentBal < 0 ? '#fecaca' : '#e2e8f0')}`,
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
                              onChange={(e) => onUpdateTender(index, { sub_option: e.target.value })}
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
                                      return match && match.balance !== undefined && match.balance !== null
                                        ? ` (${taka(match.balance)})`
                                        : '';
                                    })();
                                return (
                                  <option key={acc} value={acc}>
                                    {acc}{balSuffix}
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
                              <span style={{ color: isWallet ? '#7e22ce' : '#64748b', fontWeight: 600 }}>{balLabel}</span>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0px 4px',
                                  borderRadius: '3px',
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  background: isWallet ? (currentBal > 0 ? '#faf5ff' : '#f8fafc') : (currentBal > 0 ? '#f0fdf4' : currentBal < 0 ? '#fef2f2' : '#f8fafc'),
                                  color: isWallet ? (currentBal > 0 ? '#7e22ce' : '#64748b') : (currentBal > 0 ? '#15803d' : currentBal < 0 ? '#dc2626' : '#64748b'),
                                  border: `1px solid ${isWallet ? (currentBal > 0 ? '#f3e8ff' : '#e2e8f0') : (currentBal > 0 ? '#bbf7d0' : currentBal < 0 ? '#fecaca' : '#e2e8f0')}`,
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
                          <span style={{ color: row.transaction_id ? '#0f172a' : '#94a3b8', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                            {row.transaction_id || '—'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            placeholder={
                              getMethodType(row.method) === 'bank'
                                ? 'Cheque/Ref#'
                                : getMethodType(row.method) === 'cash'
                                ? 'Memo/Ref'
                                : isWallet
                                ? 'Note'
                                : 'TrxID'
                            }
                            value={row.transaction_id || ''}
                            onChange={(e) => onUpdateTender(index, { transaction_id: e.target.value })}
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
                      <td style={{ padding: '4px 6px', width: '115px', minWidth: '100px', textAlign: 'right' }}>
                        {isLocked ? (
                          <span style={{ fontWeight: 800, color: '#166534', fontSize: '0.82rem' }}>
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
                              setRowErrors((prev) => ({ ...prev, [index]: null }));
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                              onClick={() => handleCancel(index)}
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleAccept(index)}
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
                              onClick={() => handleCancel(index)}
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
                        <td colSpan={6} style={{ padding: '3px 8px', color: '#dc2626', fontSize: '0.70rem', fontWeight: 600 }}>
                          ⚠️ {rowError}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
