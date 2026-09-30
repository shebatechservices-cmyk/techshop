import React from 'react';
import { fullCatalogName as defaultFullCatalogName } from '../../../utils/productUtils';
import { taka as defaultTaka } from '../templates/purchaseModalHelpers';
import PurchasePrintHeader from './print/PurchasePrintHeader';
import PurchasePrintSupplierDetails from './print/PurchasePrintSupplierDetails';
import PurchasePrintItemsTable from './print/PurchasePrintItemsTable';
import PurchasePrintFinancials from './print/PurchasePrintFinancials';
import PurchasePrintSignatures from './print/PurchasePrintSignatures';

export default function PurchasePrintDocument({
  paperSize = 'a4',
  pageMargin = 'default',
  company = {},
  showLogo = true,
  showSignature = true,
  isChalan = false,
  poNumber = '',
  dateStr = '',
  order = {},
  supplierName = '',
  supplierPhone = '',
  supplierContact = '',
  supplierAddress = '',
  items = [],
  payments = [],
  itemsCost = 0,
  extraCost = 0,
  currentTotal = 0,
  previousDue = 0,
  totalPayable = 0,
  totalPaid = 0,
  remainingDue = 0,
  showFooterDetails = true,
  taka = defaultTaka,
  fullCatalogName = defaultFullCatalogName,
}) {
  return (
    <div id="purchase-print-area" className="a4-page-sheet" style={{
      width: '100%',
      maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '840px'),
      minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '200mm' : '285mm'),
      background: '#ffffff',
      color: '#1e293b',
      padding: paperSize === 'thermal_80mm' ? '0' : (pageMargin === '1in' ? '14px 18px' : (pageMargin === '0.5in' ? '10px 14px' : '8px 10px')),
      boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
      boxSizing: 'border-box',
      fontSize: paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px'),
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="invoice-page-border" style={{
        border: paperSize === 'thermal_80mm' ? 'none' : '1.5px solid #0f172a',
        borderRadius: paperSize === 'thermal_80mm' ? '0' : '4px',
        padding: paperSize === 'thermal_80mm' ? '0' : (pageMargin === '1in' ? '16px 20px' : (pageMargin === '0.5in' ? '12px 16px' : '10px 14px')),
        minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '190mm' : '270mm'),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexGrow: 1,
        boxSizing: 'border-box',
      }}>
        {/* Top Operational Document Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <PurchasePrintHeader
            company={company}
            showLogo={showLogo}
            isChalan={isChalan}
            poNumber={poNumber}
            dateStr={dateStr}
            order={order}
          />

          <PurchasePrintSupplierDetails
            supplierName={supplierName}
            supplierContact={supplierContact}
            supplierPhone={supplierPhone}
            supplierAddress={supplierAddress}
            order={order}
            items={items}
            isChalan={isChalan}
            remainingDue={remainingDue}
            totalPaid={totalPaid}
            payments={payments}
          />

          <PurchasePrintItemsTable
            items={items}
            isChalan={isChalan}
            fullCatalogName={fullCatalogName}
            taka={taka}
          />

          <PurchasePrintFinancials
            isChalan={isChalan}
            items={items}
            order={order}
            payments={payments}
            itemsCost={itemsCost}
            extraCost={extraCost}
            currentTotal={currentTotal}
            previousDue={previousDue}
            totalPayable={totalPayable}
            totalPaid={totalPaid}
            remainingDue={remainingDue}
            taka={taka}
          />
        </div>

        {/* Bottom Pinned Footer / Signatures */}
        {showFooterDetails && (
          <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
            <PurchasePrintSignatures
              showFooterDetails={showFooterDetails}
              isChalan={isChalan}
              company={company}
            />
          </div>
        )}

        {!showSignature && <div style={{ height: '8px' }} />}
      </div>
    </div>
  );
}
