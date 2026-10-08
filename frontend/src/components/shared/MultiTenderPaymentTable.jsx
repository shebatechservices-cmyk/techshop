import React, { useState, useEffect } from 'react';
import { smartFetch } from '../../services/api';
import {
  money,
  taka,
  getMethodType,
  getAccountOptions,
} from './tender/tenderPaymentUtils';
import TenderTableRow from './tender/TenderTableRow';

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
  const [dbPaymentMethods, setDbPaymentMethods] = useState(
    paymentMethodsProp || []
  );

  useEffect(() => {
    if (paymentMethodsProp && paymentMethodsProp.length > 0) {
      setDbPaymentMethods(paymentMethodsProp);
      return;
    }
    const fetchActiveAccounts = async () => {
      try {
        const res = await smartFetch('/accounts');
        const data = await res.json();
        if (
          res.ok &&
          data.success &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setDbPaymentMethods(data.data);
        }
      } catch (_) {
        // Fallback default methods
      }
    };
    fetchActiveAccounts();
  }, [paymentMethodsProp]);

  // Combined active methods list (always include fallback defaults if empty)
  const effectivePaymentMethods =
    dbPaymentMethods.length > 0
      ? dbPaymentMethods
      : [
          { id: 1, name: 'Cash', type: 'cash', is_active: true },
          { id: 2, name: 'bKash', type: 'mobile_banking', is_active: true },
          { id: 3, name: 'Nagad', type: 'mobile_banking', is_active: true },
          { id: 4, name: 'Rocket', type: 'mobile_banking', is_active: true },
          { id: 5, name: 'Bank Transfer', type: 'bank', is_active: true },
        ];

  const allAccounts =
    financialAccounts.length > 0 ? financialAccounts : walletAccounts;

  const handleMethodChange = (index, newMethodName, newMethodId) => {
    const defaultAccounts = getAccountOptions({
      method: newMethodName,
      effectivePaymentMethods,
      bankAccounts,
      mfsAccounts,
      cashAccounts,
      isPurchase,
      walletAccountLabel,
    });
    const defaultAccount = defaultAccounts[0] || '';
    onUpdateTender(index, {
      method: newMethodName,
      account_id: newMethodId || null,
      payment_method_id: null,
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

    if (
      String(row.method).toLowerCase() === 'wallet' ||
      getMethodType(row.method, effectivePaymentMethods) === 'wallet'
    ) {
      const availWallet = money(walletBalance);
      if (availWallet <= 0) {
        setRowErrors((prev) => ({
          ...prev,
          [index]: `Selected ${
            isPurchase ? 'supplier' : 'customer'
          } has no available wallet balance (৳0.00)`,
        }));
        return;
      }
      if (amt > availWallet) {
        setRowErrors((prev) => ({
          ...prev,
          [index]: `Payment amount (${taka(
            amt
          )}) exceeds available wallet balance (${taka(availWallet)})`,
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
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
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
            {tenders.filter((t) => t.isAccepted).length} of {tenders.length}{' '}
            Accepted
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
            <tr
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
              }}
            >
              <th
                style={{
                  padding: '5px 6px',
                  width: '28px',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              >
                #
              </th>
              <th
                style={{ padding: '5px 6px', minWidth: '135px', fontWeight: 700 }}
              >
                Payment Method
              </th>
              <th
                style={{ padding: '5px 6px', minWidth: '145px', fontWeight: 700 }}
              >
                Account
              </th>
              <th
                style={{
                  padding: '5px 6px',
                  width: '120px',
                  minWidth: '105px',
                  fontWeight: 700,
                }}
              >
                Ref:/Trans. ID
              </th>
              <th
                style={{
                  padding: '5px 6px',
                  width: '115px',
                  minWidth: '100px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                Amount (৳)
              </th>
              <th
                style={{
                  padding: '5px 6px',
                  width: '70px',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              >
                Action
              </th>
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
                  No payment entries. Click <strong>"+ Add more"</strong> to
                  record payment or leave empty for full due.
                </td>
              </tr>
            ) : (
              tenders.map((row, index) => (
                <TenderTableRow
                  key={row.id || index}
                  row={row}
                  index={index}
                  totalRows={tenders.length}
                  rowError={rowErrors[index]}
                  effectivePaymentMethods={effectivePaymentMethods}
                  allAccounts={allAccounts}
                  bankAccounts={bankAccounts}
                  mfsAccounts={mfsAccounts}
                  cashAccounts={cashAccounts}
                  isPurchase={isPurchase}
                  walletBalance={walletBalance}
                  walletAccountLabel={walletAccountLabel}
                  onUpdateTender={onUpdateTender}
                  onMethodChange={handleMethodChange}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                  onClearRowError={(idx) =>
                    setRowErrors((prev) => ({ ...prev, [idx]: null }))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
