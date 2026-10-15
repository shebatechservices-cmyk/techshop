import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExchangeSettlementSummary({
  originalSale = null,
  origTotal = 0,
  origPaid = 0,
  origDue = 0,
  revisedTotal = 0,
  dueCleared = 0,
  revisedRemainingDue = 0,
  netCustomerRefund = 0,
  customerOwesExtra = 0,
  returnSubtotal = 0,
  newSubtotal = 0,
  netDifference = 0,
  paidAmount = '',
  setPaidAmount,
  paymentMethod = 'Cash',
  setPaymentMethod,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#1e293b',
          }}
        >
          3. Exchange Settlement & Payment (হিসাব ও সমন্বয়)
        </h4>
        {originalSale && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Invoice: #{originalSale.invoice_no || originalSale.id}
          </span>
        )}
      </div>

      {/* Original Invoice Financial Context Pill */}
      {originalSale && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>মূল বিল: </span>
              <strong style={{ color: '#0f172a' }}>{taka(origTotal)}</strong>
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>পূর্বে জমা ছিল: </span>
              <strong style={{ color: '#059669' }}>{taka(origPaid)}</strong>
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>পূর্বের বাকি (Due): </span>
              <strong style={{ color: origDue > 0 ? '#dc2626' : '#64748b' }}>
                {taka(origDue)}
              </strong>
            </div>
          </div>

          {dueCleared > 0 && (
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#065f46',
                background: '#d1fae5',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #6ee7b7',
              }}
            >
              ✓ পূর্বের বকেয়া থেকে {taka(dueCleared)} স্বয়ংক্রিয়ভাবে সমন্বয় (পরিশোধ) হচ্ছে
            </div>
          )}
        </div>
      )}

      {/* 3 Core Metric Cards */}
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
            background:
              netCustomerRefund > 0
                ? '#f0f9ff'
                : customerOwesExtra > 0
                ? '#fff7ed'
                : '#f8fafc',
            borderRadius: '8px',
            border: `1px solid ${
              netCustomerRefund > 0
                ? '#bae6fd'
                : customerOwesExtra > 0
                ? '#fed7aa'
                : '#e2e8f0'
            }`,
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color:
                netCustomerRefund > 0
                  ? '#0369a1'
                  : customerOwesExtra > 0
                  ? '#9a3412'
                  : '#475569',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {netCustomerRefund > 0
              ? 'কাস্টমার রিফান্ড প্রাপ্য (Net Cash)'
              : customerOwesExtra > 0
              ? 'Customer Owes Extra (অতিরিক্ত জমা)'
              : revisedRemainingDue > 0
              ? 'Remaining Invoice Due (বকেয়া)'
              : 'Even Settlement (৳০)'}
          </div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color:
                netCustomerRefund > 0
                  ? '#0284c7'
                  : customerOwesExtra > 0
                  ? '#c2410c'
                  : revisedRemainingDue > 0
                  ? '#dc2626'
                  : '#15803d',
            }}
          >
            {netCustomerRefund > 0
              ? taka(netCustomerRefund)
              : customerOwesExtra > 0
              ? taka(customerOwesExtra)
              : revisedRemainingDue > 0
              ? taka(revisedRemainingDue)
              : taka(0)}
          </div>
        </div>
      </div>

      {/* Payment / Refund Transaction Controls */}
      {netCustomerRefund > 0 ? (
        <div
          style={{
            padding: '12px 14px',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '6px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#166534',
                  marginBottom: '4px',
                }}
              >
                কাস্টমারকে ক্যাশ ফেরত দেওয়া হবে (সর্বোচ্চ {taka(netCustomerRefund)}):
              </label>
              <input
                type="number"
                min="0"
                max={netCustomerRefund}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #86efac',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#15803d',
                  width: '180px',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: '#15803d',
                fontWeight: 600,
                paddingTop: '18px',
              }}
            >
              (ক্যাশ ড্রয়ার থেকে নগদ দেওয়া হলে এই অংক থাকবে)
            </div>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#4b5563',
              lineHeight: 1.4,
            }}
          >
            💡 <strong>নোট:</strong> কাস্টমারকে নগদ টাকা ফেরত দিলে ড্রয়ার থেকে টাকা কমে যাবে। আর কাস্টমার নগদ টাকা না নিয়ে দোকানে জমা রাখতে চাইলে উপরে <strong>'0'</strong> লিখে দিন (টাকা কাস্টমার ওয়ালেটে ক্রেডিট হয়ে থাকবে)।
          </div>
        </div>
      ) : customerOwesExtra > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Amount Paid by Customer (কাস্টমার পরিশোধ করল):
            </label>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              Payment Method:
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
              }}
            >
              <option value="Cash">Cash Drawer</option>
              <option value="Bank">Bank Transfer</option>
              <option value="MFS">bKash / Nagad</option>
            </select>
          </div>
        </div>
      ) : dueCleared > 0 ? (
        <div
          style={{
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '0.78rem',
            color: '#475569',
          }}
        >
          ✓ রিটার্ন মূল্যের মাধ্যমে পূর্বের বকেয়া স্বয়ংক্রিয়ভাবে কাটাকাটি হয়েছে। কোনো অতিরিক্ত ক্যাশ আদান-প্রদানের প্রয়োজন নেই।
        </div>
      ) : null}
    </div>
  );
}
