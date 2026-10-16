import React, { useState } from 'react';
import {
  money,
  taka,
  getMethodType,
  getAccountOptions,
} from './tender/tenderPaymentUtils';
import { useMultiTenderMethods } from './tender/useMultiTenderMethods';
import MultiTenderHeader from './tender/MultiTenderHeader';
import MultiTenderTableThead from './tender/MultiTenderTableThead';
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
  const { effectivePaymentMethods } = useMultiTenderMethods(paymentMethodsProp);

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

  const acceptedCount = tenders.filter((t) => t.isAccepted).length;

  return (
    <div style={{ width: '100%', marginTop: '8px' }}>
      <MultiTenderHeader
        acceptedCount={acceptedCount}
        totalCount={tenders.length}
        onAddTender={onAddTender}
      />

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
          <MultiTenderTableThead />
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
