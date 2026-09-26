import React from 'react';
import { taka, formatDecimal, takaInWords, formatPrintDateTime } from './printModalHelpers';

export default function ThermalReceiptView({
  storeName,
  storeSubtitle,
  storeAddress,
  storePhones,
  storeLogo,
  showLogo,
  customerName,
  customerPhone,
  docNumber,
  dateFormatted,
  timeFormatted,
  items,
  totalQuantity,
  subtotal,
  discount,
  vat,
  setupCharge,
  extraCost,
  extraCostCategory,
  netPayable,
  previousDue,
  totalDueAmount,
  paidAmount,
  dueAmount,
  paymentTenders,
  returnPolicyText,
  printTime,
}) {
  return (
    <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', fontFamily: 'monospace', fontSize: '11px', color: '#000000', lineHeight: 1.3 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
        {showLogo && storeLogo && (
          <img
            src={storeLogo}
            alt="Logo"
            style={{ maxHeight: '40px', maxWidth: '80px', objectFit: 'contain', margin: '0 auto 4px auto' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{storeName}</div>
        {storeSubtitle && <div style={{ fontSize: '10px' }}>{storeSubtitle}</div>}
        {storeAddress && <div style={{ fontSize: '9.5px' }}>{storeAddress}</div>}
        {storePhones && <div style={{ fontSize: '9.5px' }}>Tel: {storePhones}</div>}
      </div>

      {/* Invoice Meta */}
      <div style={{ marginBottom: '6px', borderBottom: '1px dashed #000', paddingBottom: '4px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Invoice: <strong>{docNumber}</strong></span>
          <span>Date: {dateFormatted}</span>
        </div>
        {timeFormatted && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Time: {timeFormatted}</span>
            <span>Cust: {customerName}</span>
          </div>
        )}
        {customerPhone && <div>Phone: {customerPhone}</div>}
      </div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
            <th style={{ textAlign: 'center', width: '30px', padding: '2px 0' }}>Qty</th>
            <th style={{ textAlign: 'right', width: '50px', padding: '2px 0' }}>Price</th>
            <th style={{ textAlign: 'right', width: '55px', padding: '2px 0' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
              <td style={{ padding: '3px 0' }}>
                <div>{it.name}</div>
                {it.serials && it.serials.length > 0 && (
                  <div style={{ fontSize: '8.5px', color: '#444' }}>S/N: {it.serials.join(', ')}</div>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '3px 0' }}>{formatDecimal(it.qty)}</td>
              <td style={{ textAlign: 'right', padding: '3px 0' }}>{taka(it.unitPrice)}</td>
              <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold' }}>{taka(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginBottom: '6px', fontSize: '10.5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Qty:</span>
          <span>{formatDecimal(totalQuantity)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{taka(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span>
            <span>-{taka(discount)}</span>
          </div>
        )}
        {vat > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT / Tax:</span>
            <span>+{taka(vat)}</span>
          </div>
        )}
        {(setupCharge > 0 || extraCost > 0) && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{extraCostCategory || 'Extra Charge'}:</span>
            <span>+{taka(setupCharge + extraCost)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0', margin: '2px 0' }}>
          <span>Net Payable:</span>
          <span>{taka(netPayable)}</span>
        </div>
        {previousDue !== 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Prev Due:</span>
            <span>{taka(previousDue)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Paid:</span>
          <span>{taka(paidAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: dueAmount > 0 ? '#000' : '#444' }}>
          <span>Due:</span>
          <span>{taka(dueAmount)}</span>
        </div>
      </div>

      {/* Tenders */}
      {paymentTenders.length > 0 && (
        <div style={{ fontSize: '9px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <strong>Payment:</strong>{' '}
          {paymentTenders.map((t, idx) => `${t.method || 'Cash'}: ${taka(t.amount || 0)}`).join(', ')}
        </div>
      )}

      {/* Return policy */}
      {returnPolicyText && (
        <div style={{ fontSize: '8.5px', textAlign: 'center', margin: '4px 0', color: '#333' }}>
          {returnPolicyText}
        </div>
      )}

      {/* Footer thank you */}
      <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px' }}>
        <div>Thank you for your purchase!</div>
        <div style={{ fontSize: '8px', color: '#666' }}>Printed: {formatPrintDateTime(printTime)}</div>
      </div>
    </div>
  );
}
