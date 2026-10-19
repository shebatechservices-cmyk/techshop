import React from 'react';
import InventoryProductInfoCell from './row/InventoryProductInfoCell';
import InventoryStockCell from './row/InventoryStockCell';
import InventoryPriceCell from './row/InventoryPriceCell';
import InventoryWarrantyAgingCell from './row/InventoryWarrantyAgingCell';
import InventoryRowActionsCell from './row/InventoryRowActionsCell';

export default function InventoryTableRow({
  product: p,
  isSelected,
  toggleSelectRow,
  warehouses,
  selectedWarehouseId,
  revealedCostIds,
  toggleCostVisibility,
  taka,
  getWarrantyValidity,
  handleOpenWarrantyModal,
  handleToggleEcommerce,
  onViewProductDetails,
  onOpenNewSale,
  onOpenNewQuotation,
  handleOpenLabelModal,
  handleOpenTransferModal,
  isTechnician = false,
}) {
  const stock = Number(p.stock || 0);
  const minStock = Number(p.min_stock || 5);
  const isOut = stock <= 0;
  const isLow = stock <= minStock && !isOut;
  const agingDays = Number(p.aging_days || 0);
  const isAged60Plus = agingDays >= 60;

  // Compute Supplier Warranty Expiry Date
  let expDateStr = p.supplier_warranty_expire_date;
  const supMonths = Number(p.supplier_warranty_months || p.warranty_months || 0);
  if (!expDateStr && p.purchase_date && supMonths > 0) {
    const pd = new Date(p.purchase_date);
    if (!isNaN(pd.getTime())) {
      const exp = new Date(pd);
      exp.setMonth(exp.getMonth() + supMonths);
      expDateStr = exp.toISOString().split('T')[0];
    }
  }

  const validity = expDateStr && getWarrantyValidity ? getWarrantyValidity(expDateStr) : null;
  const warehouseName = warehouses?.find((w) => w.id === selectedWarehouseId)?.name || 'Warehouse';

  return (
    <tr
      key={p.id}
      onClick={(e) => {
        if (e.target.closest('button, input, select, a, [data-prevent-row-click="true"]')) {
          return;
        }
        if (onViewProductDetails) {
          onViewProductDetails(p);
        }
      }}
      className={`border-b border-slate-100 transition-colors cursor-pointer ${
        isSelected ? 'bg-sky-50' : 'bg-white hover:bg-sky-50/40'
      }`}
      title="Click row to view full product details"
    >
      {/* 1. Checkbox */}
      <td
        className="py-1 px-2 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectRow(p.id)}
          className="cursor-pointer"
        />
      </td>

      {/* 2. Image Thumbnail */}
      <td className="py-1 px-1.5 text-center align-middle">
        <div
          onClick={() => onViewProductDetails && onViewProductDetails(p)}
          className="w-[30px] h-[30px] rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden mx-auto cursor-pointer hover:border-sky-400 hover:ring-2 hover:ring-sky-200 transition-all"
          title="Click to view full details"
        >
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">📷</span>
          )}
        </div>
      </td>

      {/* 3. Product Info: Title + SKU + Category */}
      <InventoryProductInfoCell
        product={p}
        onViewProductDetails={onViewProductDetails}
      />

      {/* 4. Stock & Record */}
      <InventoryStockCell
        product={p}
        stock={stock}
        isOut={isOut}
        isLow={isLow}
        warehouseName={warehouseName}
      />

      {/* 5. Pricing (Sale Price & Cost Price) */}
      <InventoryPriceCell
        product={p}
        taka={taka}
        isTechnician={isTechnician}
        revealedCostIds={revealedCostIds}
        toggleCostVisibility={toggleCostVisibility}
      />

      {/* 6 & 7. Aging & Warranty */}
      <InventoryWarrantyAgingCell
        product={p}
        agingDays={agingDays}
        isAged60Plus={isAged60Plus}
        expDateStr={expDateStr}
        validity={validity}
        handleOpenWarrantyModal={handleOpenWarrantyModal}
      />

      {/* 8 & 9. E-Commerce & Actions */}
      <InventoryRowActionsCell
        product={p}
        isTechnician={isTechnician}
        handleToggleEcommerce={handleToggleEcommerce}
        onViewProductDetails={onViewProductDetails}
        onOpenNewQuotation={onOpenNewQuotation}
        onOpenNewSale={onOpenNewSale}
        handleOpenLabelModal={handleOpenLabelModal}
        handleOpenTransferModal={handleOpenTransferModal}
      />
    </tr>
  );
}
