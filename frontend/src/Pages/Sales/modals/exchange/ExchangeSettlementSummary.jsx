import React from 'react';
import ExchangeOriginalContextPill from './summary/ExchangeOriginalContextPill';
import ExchangeCoreMetricCards from './summary/ExchangeCoreMetricCards';
import ExchangePaymentControls from './summary/ExchangePaymentControls';

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
      <ExchangeOriginalContextPill
        originalSale={originalSale}
        origTotal={origTotal}
        origPaid={origPaid}
        origDue={origDue}
        dueCleared={dueCleared}
        taka={taka}
      />

      {/* 3 Core Metric Cards */}
      <ExchangeCoreMetricCards
        returnSubtotal={returnSubtotal}
        newSubtotal={newSubtotal}
        netCustomerRefund={netCustomerRefund}
        customerOwesExtra={customerOwesExtra}
        revisedRemainingDue={revisedRemainingDue}
        taka={taka}
      />

      {/* Payment / Refund Transaction Controls */}
      <ExchangePaymentControls
        netCustomerRefund={netCustomerRefund}
        customerOwesExtra={customerOwesExtra}
        dueCleared={dueCleared}
        paidAmount={paidAmount}
        setPaidAmount={setPaidAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        taka={taka}
      />
    </div>
  );
}
