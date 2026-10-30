import React from 'react';
import PurchaseCartItemRow from './PurchaseCartItemRow';

const PurchaseCartItemList = React.memo(function PurchaseCartItemList({
  items = [],
  expandedId,
  setExpandedId,
  newlyAddedId = null,
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
  const activeNewItem =
    newlyAddedId && expandedId === newlyAddedId
      ? items.find((it) => it.localId === newlyAddedId)
      : null;

  const regularItems = activeNewItem
    ? items.filter((it) => it.localId !== activeNewItem.localId)
    : items;

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <div className="p-7 text-center border-[1.5px] border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
          🛒 No products added yet. Search and add products above or click{' '}
          <strong>+</strong> to add a new catalog item.
        </div>
      )}

      {/* Docked Active New Entry Card (Displayed at Top when newly added) */}
      {activeNewItem && (
        <div className="flex flex-col gap-1.5 p-1 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 shadow-sm">
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ⚡ Newly Added Item (মূল্য ও সিরিয়াল দিয়ে কলাপ্স করুন)
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold normal-case">
              (কলাপ্স করলে তার ক্রমানুসারে চলে যাবে)
            </span>
          </div>
          <PurchaseCartItemRow
            key={activeNewItem.localId}
            item={activeNewItem}
            isExpanded={true}
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
        </div>
      )}

      {/* Regular Chronological Items List */}
      {regularItems.map((item) => (
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
