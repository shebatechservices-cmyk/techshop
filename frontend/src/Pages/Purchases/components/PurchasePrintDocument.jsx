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
      minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '195mm' : '275mm'),
      background: '#ffffff',
      color: '#1e293b',
      borderRadius: '12px',
      padding: pageMargin === '1in' ? '36px 40px' : (pageMargin === '0.5in' ? '22px 26px' : '16px 20px'),
      boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
      boxSizing: 'border-box',
      fontSize: paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px'),
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
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

      {showFooterDetails && (
        <PurchasePrintSignatures
          showFooterDetails={showFooterDetails}
          isChalan={isChalan}
          company={company}
        />
      )}

      {!showSignature && <div style={{ height: '8px' }} />}
    </div>
  );
}
