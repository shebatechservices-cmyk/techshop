import React from 'react';

export default function ExchangeCoreMetricCards({
  returnSubtotal = 0,
  newSubtotal = 0,
  netCustomerRefund = 0,
  customerOwesExtra = 0,
  revisedRemainingDue = 0,
  taka,
}) {
  const isRefund = netCustomerRefund > 0;
  const isOwesExtra = customerOwesExtra > 0;
  const hasRemainingDue = revisedRemainingDue > 0;

  const cardBorder = isRefund ? '#bae6fd' : isOwesExtra ? '#fed7aa' : '#e2e8f0';
  const cardBg = isRefund ? '#f0f9ff' : isOwesExtra ? '#fff7ed' : '#f8fafc';
  const labelColor = isRefund ? '#0369a1' : isOwesExtra ? '#9a3412' : '#475569';
  const valColor = isRefund ? '#0284c7' : isOwesExtra ? '#c2410c' : hasRemainingDue ? '#dc2626' : '#15803d';

  const labelText = isRefund
    ? 'কাস্টমার রিফান্ড প্রাপ্য (Net Cash)'
    : isOwesExtra
    ? 'Customer Owes Extra (অতিরিক্ত জমা)'
    : hasRemainingDue
    ? 'Remaining Invoice Due (বকেয়া)'
    : 'Even Settlement (৳০)';

  const valAmount = isRefund
    ? netCustomerRefund
    : isOwesExtra
    ? customerOwesExtra
    : hasRemainingDue
    ? revisedRemainingDue
    : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: '#ecfdf5',
          borderRadius: '8px',
          border: '1px solid #a7f3d0',
        }}
      >
        <div
          style={{
            fontSize: '0.74rem',
            color: '#065f46',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Return Credit Value
        </div>
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#047857',
          }}
        >
          {taka(returnSubtotal)}
        </div>
      </div>

      <div
        style={{
          padding: '10px 14px',
          background: '#eef2ff',
          borderRadius: '8px',
          border: '1px solid #c7d2fe',
        }}
      >
        <div
          style={{
            fontSize: '0.74rem',
            color: '#3730a3',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          New Items Subtotal
        </div>
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#4338ca',
          }}
        >
          {taka(newSubtotal)}
        </div>
      </div>

      <div
        style={{
          padding: '10px 14px',
          background: cardBg,
          borderRadius: '8px',
          border: `1px solid ${cardBorder}`,
        }}
      >
        <div
          style={{
            fontSize: '0.74rem',
            color: labelColor,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {labelText}
        </div>
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: valColor,
          }}
        >
          {taka(valAmount)}
        </div>
      </div>
    </div>
  );
}
