import React from 'react';

export default function ExchangePaymentControls({
  netCustomerRefund = 0,
  customerOwesExtra = 0,
  dueCleared = 0,
  paidAmount = '',
  setPaidAmount,
  paymentMethod = 'Cash',
  setPaymentMethod,
  taka,
}) {
  if (netCustomerRefund > 0) {
    return (
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
    );
  }

  if (customerOwesExtra > 0) {
    return (
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
    );
  }

  if (dueCleared > 0) {
    return (
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
    );
  }

  return null;
}
