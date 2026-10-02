import React, { useState, useRef } from 'react';
import {
  taka,
  money,
  computeFinalSale,
  isProductSerialTracked,
} from '../hooks/usePurchaseCart';
import CartItemCameraScanner from './CartItemCameraScanner';
import CartItemSerialsList, { CartItemSerialChips } from './CartItemSerialsList';
import CartItemSummaryBadges from './item/CartItemSummaryBadges';
import CartItemPricingInputs from './item/CartItemPricingInputs';
import CartItemWarrantyInputs from './item/CartItemWarrantyInputs';
import CartItemCollapsedRow from './item/CartItemCollapsedRow';

const PurchaseCartItemRow = React.memo(function PurchaseCartItemRow({
  item,
  isExpanded,
  setExpandedId,
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
  const [tempBarcode, setTempBarcode] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const inputRef = useRef(null);

  const cost = money(item.cost_price);
  const qty = Number(item.quantity || 1);
  const lineTotal = Number((cost * qty).toFixed(2));
  const safeTotalGoodsCost = money(totalGoodsCost);
  const safeExtraCost = money(extraCostValue);
  const overheadRatio = safeTotalGoodsCost > 0 && safeExtraCost > 0
    ? safeExtraCost / safeTotalGoodsCost
    : 0;
  const finalUnitCost = Number((cost * (1 + overheadRatio)).toFixed(2));
  const finalLineTotal = Number((finalUnitCost * qty).toFixed(2));
  const finalSale = computeFinalSale(item, finalUnitCost) || money(item.sale_price);

  const displayName =
    (item?.full_name && item.full_name !== 'Product' ? item.full_name : '') ||
    (item?.product_name && item.product_name !== 'Product' ? item.product_name : '') ||
    item?.product?.full_name ||
    item?.product?.name ||
    item?.Product?.name ||
    item?.Product?.full_name ||
    item?.item_name ||
    (item?.name && item.name !== 'Product' ? item.name : '') ||
    item?.catalog_name ||
    (item?.brand_name && item?.model_name ? `${item.brand_name} ${item.model_name}` : '') ||
    item?.brand_name ||
    item?.model_name ||
    (item?.sku ? `SKU: ${item.sku}` : 'Product');

  const barcodesList = Array.isArray(item.barcodes)
    ? item.barcodes
    : Array.isArray(item.serials)
    ? item.serials
    : [];

  const isSerialTracked = Boolean(
    barcodesList.length > 0 ||
    item.is_serial_tracked ||
    item.is_serial_required ||
    item.isSerialRequired ||
    item.has_serials ||
    isProductSerialTracked(item)
  );

  const soldQuantity = Number(
    item.soldQuantity || item.sold_quantity || item.sold_count || 0
  );
  const isSoldLocked = soldQuantity > 0;

  const onAdd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentInputValue = tempBarcode.toUpperCase().trim();
    if (!currentInputValue) return;

    handleAddBarcode(item.localId, currentInputValue);
    setTempBarcode('');

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // COLLAPSED ITEM VIEW
  if (!isExpanded) {
    return (
      <CartItemCollapsedRow
        item={item}
        displayName={displayName}
        qty={qty}
        isSerialTracked={isSerialTracked}
        barcodesList={barcodesList}
        cost={cost}
        overheadRatio={overheadRatio}
        finalUnitCost={finalUnitCost}
        finalLineTotal={finalLineTotal}
        lineTotal={lineTotal}
        finalSale={finalSale}
        isSoldLocked={isSoldLocked}
        soldQuantity={soldQuantity}
        setExpandedId={setExpandedId}
        handleRemoveItem={handleRemoveItem}
        taka={taka}
      />
    );
  }

  // EXPANDED ITEM VIEW
  return (
    <div className="border-[1.5px] border-emerald-500 rounded-xl bg-white p-3.5 shadow-sm">
      {/* Line 1: Full Catalog Name at Top */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-emerald-500 text-lg leading-none shrink-0">⬡</span>
          <span className="font-extrabold text-sm text-slate-900 truncate">
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpandedId(null)}
            className="bg-transparent border-0 text-sky-600 font-bold text-xs cursor-pointer p-0 hover:text-sky-700"
          >
            ▲ Collapse
          </button>
          <button
            type="button"
            disabled={isSoldLocked}
            onClick={() => {
              if (!isSoldLocked) handleRemoveItem(item.localId);
            }}
            className={`border-0 text-sm p-0 transition-colors ${
              isSoldLocked
                ? 'bg-transparent text-slate-300 cursor-not-allowed'
                : 'bg-transparent text-rose-500 hover:text-rose-700 cursor-pointer'
            }`}
            title={
              isSoldLocked
                ? `Cannot remove: ${soldQuantity} unit(s) already sold`
                : 'Remove product'
            }
          >
            {isSoldLocked ? '🔒' : '✕'}
          </button>
        </div>
      </div>

      {/* Line 2: Summary Details Badge Bar */}
      <CartItemSummaryBadges
        qty={qty}
        isSerialTracked={isSerialTracked}
        barcodesList={barcodesList}
        cost={cost}
        overheadRatio={overheadRatio}
        finalUnitCost={finalUnitCost}
        lineTotal={lineTotal}
        finalLineTotal={finalLineTotal}
        item={item}
        finalSale={finalSale}
        taka={taka}
      />

      {/* Row 1: Pricing & Quantity Form Controls Grid */}
      <CartItemPricingInputs
        item={item}
        cost={cost}
        qty={qty}
        overheadRatio={overheadRatio}
        finalUnitCost={finalUnitCost}
        finalSale={finalSale}
        isSoldLocked={isSoldLocked}
        soldQuantity={soldQuantity}
        isSerialTracked={isSerialTracked}
        barcodesList={barcodesList}
        updateItem={updateItem}
        handleItemCostChange={handleItemCostChange}
        handleItemMarginChange={handleItemMarginChange}
        taka={taka}
      />

      {/* Row 2: Warranty & Barcode Scanning Controls */}
      <div className="grid grid-cols-[140px_110px_110px_1fr] gap-2 items-end">
        <CartItemWarrantyInputs item={item} updateItem={updateItem} />

        <CartItemSerialsList
          item={item}
          tempBarcode={tempBarcode}
          setTempBarcode={setTempBarcode}
          inputRef={inputRef}
          onAdd={onAdd}
          setIsCameraScannerOpen={setIsCameraScannerOpen}
          barcodesList={barcodesList}
          barcodeScanErrors={barcodeScanErrors}
          handleRemoveBarcode={handleRemoveBarcode}
          isSerialTracked={isSerialTracked}
          renderChips={false}
        />
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CartItemCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        displayName={displayName}
      />

      {/* Serial Chips */}
      <CartItemSerialChips
        item={item}
        barcodesList={barcodesList}
        handleRemoveBarcode={handleRemoveBarcode}
      />
    </div>
  );
});

export default PurchaseCartItemRow;
