import React from 'react';

export default React.memo(function PurchaseOrderHeader({
  orderToEdit = null,
  items = [],
  selectedSupplierObj = null,
  onClose = () => {},
}) {
  const hasSoldItems = Boolean(
    orderToEdit?.has_sales ||
    items.some(
      (it) => Number(it.soldQuantity || it.sold_quantity || it.sold_count || 0) > 0
    )
  );

  return (
    <div className="flex justify-between items-center py-4 px-6 border-b border-slate-100 bg-white flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{orderToEdit ? '✏️' : '🛒'}</span>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="m-0 text-xl font-extrabold text-slate-900">
              {orderToEdit
                ? `Edit Purchase Order #${orderToEdit.po_number || orderToEdit.id}`
                : 'New Purchase Order'}
            </h2>
            {hasSoldItems && (
              <span className="text-[0.72rem] bg-amber-100 text-amber-800 py-0.5 px-2 rounded font-bold border border-amber-200">
                ⚠️ Sold Items Locked
              </span>
            )}
            {orderToEdit && (
              <span className="text-[0.72rem] bg-sky-100 text-sky-700 py-0.5 px-2 rounded font-bold">
                ⏱️ 72h Edit Window
              </span>
            )}
          </div>
          <p className="mt-0.5 mb-0 text-xs text-slate-500">
            {orderToEdit
              ? hasSoldItems
                ? 'Prices and barcodes can be updated. Deleting or reducing sold quantities is strictly prohibited.'
                : 'Prices, quantities, serials, and supplier details can be updated.'
              : 'Procurement, Stock Inward, and Supplier Dues Management'}
          </p>
        </div>
      </div>

      {/* Quick Actions / Emergency Contact */}
      <div className="flex items-center gap-2.5">
        {selectedSupplierObj?.phone && (
          <a
            href={`tel:${selectedSupplierObj.phone}`}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold no-underline hover:bg-emerald-100 transition-colors"
            title={`Call supplier: ${selectedSupplierObj.phone}`}
          >
            <span>📞 Call: {selectedSupplierObj.phone}</span>
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-0 text-xl text-slate-500 hover:text-slate-700 cursor-pointer p-1 leading-none"
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
});
