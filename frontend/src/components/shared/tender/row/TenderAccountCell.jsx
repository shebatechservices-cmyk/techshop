import React from 'react';
import { taka, accountLabel } from '../tenderPaymentUtils';

export default function TenderAccountCell({
  isLocked,
  isWallet,
  effectiveSub,
  currentBal,
  balLabel,
  accountOptions,
  walletBalance,
  allAccounts,
  index,
  onUpdateTender,
}) {
  const badgeBg = isWallet
    ? currentBal > 0
      ? '#faf5ff'
      : '#f8fafc'
    : currentBal > 0
    ? '#f0fdf4'
    : currentBal < 0
    ? '#fef2f2'
    : '#f8fafc';

  const badgeColor = isWallet
    ? currentBal > 0
      ? '#7e22ce'
      : '#64748b'
    : currentBal > 0
    ? '#15803d'
    : currentBal < 0
    ? '#dc2626'
    : '#64748b';

  const badgeBorder = isWallet
    ? currentBal > 0
      ? '#f3e8ff'
      : '#e2e8f0'
    : currentBal > 0
    ? '#bbf7d0'
    : currentBal < 0
    ? '#fecaca'
    : '#e2e8f0';

  const balanceBadge = (
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
          background: badgeBg,
          color: badgeColor,
          border: `1px solid ${badgeBorder}`,
        }}
      >
        {taka(currentBal)}
      </span>
    </div>
  );

  return (
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
          {balanceBadge}
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
          {balanceBadge}
        </div>
      )}
    </td>
  );
}
