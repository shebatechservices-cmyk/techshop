import React from 'react';
import PurchaseCartItemRow from './PurchaseCartItemRow';

const PurchaseCartItemList = React.memo(function PurchaseCartItemList({
  items = [],
  expandedId,
  setExpandedId,
  barcodeInput,
  setBarcodeInput,
  barcodeInputRef,
  barcodeScanErrors = {},
  updateItem,
  handleItemCostChange,
  handleItemMarginChange,
  handleAddBarcode,
  handleRemoveBarcode,
  handleRemoveItem,
  totalGoodsCost = 0,
  extraCostValue = 0,
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <div className="p-7 text-center border-[1.5px] border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
          🛒 No products added yet. Search and add products above or click{' '}
          <strong>+</strong> to add a new catalog item.
        </div>
      )}

      {items.map((item) => (
        <PurchaseCartItemRow
          key={item.localId}
          item={item}
          isExpanded={expandedId === item.localId}
          setExpandedId={setExpandedId}
          barcodeScanErrors={barcodeScanErrors}
          updateItem={updateItem}
          handleItemCostChange={handleItemCostChange}
          handleItemMarginChange={handleItemMarginChange}
          handleAddBarcode={handleAddBarcode}
          handleRemoveBarcode={handleRemoveBarcode}
          handleRemoveItem={handleRemoveItem}
          totalGoodsCost={totalGoodsCost}
          extraCostValue={extraCostValue}
        />
      ))}
    </div>
  );
});

export const PurchaseItemCard = PurchaseCartItemRow;
export default PurchaseCartItemList;
