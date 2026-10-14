import React from 'react';
import {
  getMethodIcon,
  getMethodType,
  getAccountOptions,
  getAccountBalance,
} from './tenderPaymentUtils';
import TenderMethodCell from './row/TenderMethodCell';
import TenderAccountCell from './row/TenderAccountCell';
import TenderTrxCell from './row/TenderTrxCell';
import TenderAmountCell from './row/TenderAmountCell';
import TenderActionCell from './row/TenderActionCell';

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
        <TenderMethodCell
          isLocked={isLocked}
          row={row}
          index={index}
          effectivePaymentMethods={effectivePaymentMethods}
          methodIcon={methodIcon}
          onMethodChange={onMethodChange}
        />

        {/* Account with live balance display */}
        <TenderAccountCell
          isLocked={isLocked}
          isWallet={isWallet}
          effectiveSub={effectiveSub}
          currentBal={currentBal}
          balLabel={balLabel}
          accountOptions={accountOptions}
          walletBalance={walletBalance}
          allAccounts={allAccounts}
          index={index}
          onUpdateTender={onUpdateTender}
        />

        {/* Ref / Trans. ID */}
        <TenderTrxCell
          isLocked={isLocked}
          isWallet={isWallet}
          row={row}
          index={index}
          effectivePaymentMethods={effectivePaymentMethods}
          onUpdateTender={onUpdateTender}
        />

        {/* Amount */}
        <TenderAmountCell
          isLocked={isLocked}
          row={row}
          index={index}
          rowError={rowError}
          onUpdateTender={onUpdateTender}
          onClearRowError={onClearRowError}
        />

        {/* Action */}
        <TenderActionCell
          isLocked={isLocked}
          index={index}
          onAccept={onAccept}
          onCancel={onCancel}
        />
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
