import React, { useEffect } from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SerialBarcodeQuickViewModal({
  isOpen,
  onClose,
  data,
  matchType,
  scannedCode,
  onNavigate,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const product = data.product || {};
  const purchase = data.purchase || {};
  const inventory = data.inventory || {};
  const sale = data.sale || null;
  const warranty = data.warranty || {};
  const serialCode = data.serial_code || scannedCode;

  const isSold = data.status === 'Sold' || Boolean(sale?.invoice_no);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-xl text-xl backdrop-blur-md">
              🔍
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {matchType === 'SERIAL_SOLD'
                    ? 'Unit Serial (Sold)'
                    : matchType === 'SERIAL_INVENTORY'
                    ? 'Unit Serial (In Stock)'
                    : matchType === 'PRODUCT_BARCODE'
                    ? 'Product Model Barcode'
                    : 'Tracked Record'}
                </span>
                {serialCode && (
                  <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">
                    S/N: {serialCode}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {product.name || 'Product Details'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Identity Subheader */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-slate-600">
            {product.brand_name && (
              <span>Brand: <strong className="text-slate-800">{product.brand_name}</strong></span>
            )}
            {product.category_name && (
              <span>Category: <strong className="text-slate-800">{product.category_name}</strong></span>
            )}
            {product.sku && (
              <span>SKU: <strong className="font-mono text-slate-800">{product.sku}</strong></span>
            )}
            {product.barcode && (
              <span>Barcode: <strong className="font-mono text-slate-800">{product.barcode}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                isSold
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : Number(inventory.stock || product.stock) > 0
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              ● {isSold ? 'Sold Unit' : Number(inventory.stock || product.stock) > 0 ? 'In Stock Unit' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Modal Body - 4 Operational Dimensions Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Dimension 1: Purchase Order Information */}
            <div className="bg-white rounded-xl border border-sky-100 shadow-xs p-4 flex flex-col justify-between hover:border-sky-300 transition">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-sky-50">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg text-sm">🚚</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      1. Purchase Information
                    </h4>
                  </div>
                  {purchase.po_number && (
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                      {purchase.po_number}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier:</span>
                    <span className="font-bold text-slate-800 text-right">
                      {purchase.supplier_name || 'Authorized Supplier'}
                    </span>
                  </div>
                  {purchase.supplier_phone && purchase.supplier_phone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-mono text-slate-700">{purchase.supplier_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Date:</span>
                    <span className="font-semibold text-slate-700">
                      {purchase.purchase_date
                        ? new Date(purchase.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Stock Inflow'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit Cost Price:</span>
                    <span className="font-bold text-slate-900">{taka(purchase.cost_price || product.cost_price)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Supplier Warranty:</span>
                    <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                      {purchase.supplier_warranty_expire_date
                        ? `Expires: ${new Date(purchase.supplier_warranty_expire_date).toLocaleDateString('en-GB')}`
                        : 'Standard Vendor Coverage'}
                    </span>
                  </div>
                </div>
              </div>

              {purchase.po_number && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ section: 'purchases', tab: 'history', search: purchase.po_number });
                  }}
                  className="mt-3 w-full py-1.5 text-center text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                >
                  View Purchase Order →
                </button>
              )}
            </div>

            {/* Dimension 2: Inventory & Stock */}
            <div className="bg-white rounded-xl border border-emerald-100 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-50">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm">📦</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      2. Inventory & Stock Status
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      Number(inventory.stock || product.stock) > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Stock: {inventory.stock ?? product.stock ?? 0} pcs
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Unit State:</span>
                    <span className="font-bold text-slate-800">
                      {inventory.unit_status || (isSold ? 'Sold to Customer' : 'Available in Inventory')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selling Price:</span>
                    <span className="font-bold text-emerald-700">{taka(inventory.sale_price || product.sale_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cost Valuation:</span>
                    <span className="font-semibold text-slate-700">{taka(inventory.cost_price || product.cost_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serial Tracking:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      Individual Serial Tracked
                    </span>
                  </div>
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ section: 'inventory', search: product.name || product.sku });
                  }}
                  className="mt-3 w-full py-1.5 text-center text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                >
                  Inspect in Inventory →
                </button>
              )}
            </div>

            {/* Dimension 3: Sales Invoice */}
            <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-4 flex flex-col justify-between hover:border-indigo-300 transition">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-50">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm">🛒</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      3. Sales Invoice
                    </h4>
                  </div>
                  {sale?.invoice_no ? (
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {sale.invoice_no}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Not Sold Yet
                    </span>
                  )}
                </div>

                {sale?.invoice_no ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-slate-800">{sale.customer_name || 'Customer'}</span>
                    </div>
                    {sale.customer_phone && sale.customer_phone !== 'N/A' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-mono text-slate-700">{sale.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sale Date:</span>
                      <span className="font-semibold text-slate-700">
                        {sale.sale_date
                          ? new Date(sale.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Invoice Date'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoiced Amount:</span>
                      <span className="font-bold text-indigo-700">{taka(sale.unit_price)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {sale.payment_status || 'Paid'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    This unit has not been sold yet. It remains in current stock.
                  </div>
                )}
              </div>

              {sale?.invoice_no && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ section: 'sales', tab: 'history', search: sale.invoice_no });
                  }}
                  className="mt-3 w-full py-1.5 text-center text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                >
                  View Sales Invoice →
                </button>
              )}
            </div>

            {/* Dimension 4: Warranty & Returns */}
            <div className="bg-white rounded-xl border border-amber-100 shadow-xs p-4 flex flex-col justify-between hover:border-amber-300 transition">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-50">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm">🛡️</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      4. Warranty & Returns
                    </h4>
                  </div>
                  {isSold ? (
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        warranty.is_customer_warranty_valid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {warranty.is_customer_warranty_valid ? '✓ Warranty Valid' : '⚠️ Expired'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {warranty.warranty_months || product.warranty_months || 12} Months Policy
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {isSold ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer Expiry:</span>
                        <span className="font-bold text-slate-800">
                          {warranty.customer_warranty_expiry || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Days Remaining:</span>
                        <span
                          className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                            warranty.is_customer_warranty_valid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {warranty.customer_days_remaining ?? 0} days remaining
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Includes +{warranty.grace_days || 60} days supplier grace allowance.
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-600">
                      {warranty.customer_warranty_info || 'Available in stock. Warranty starts when customer invoice is issued.'}
                    </div>
                  )}

                  {/* Claims or Returns list */}
                  {warranty.claims && warranty.claims.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Service Claims:</span>
                      {warranty.claims.map((wc, i) => (
                        <div key={i} className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded mb-1">
                          Claim #{wc.claim_no} ({wc.status}): {wc.issue_description || 'In service'}
                        </div>
                      ))}
                    </div>
                  )}

                  {warranty.returns && warranty.returns.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Returns / Refunds:</span>
                      {warranty.returns.map((ret, i) => (
                        <div key={i} className="text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded mb-1">
                          Return #{ret.return_no}: {ret.return_qty} pcs ({taka(ret.refund_amount)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ section: 'warranty', search: serialCode || product.name });
                  }}
                  className="mt-3 w-full py-1.5 text-center text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                >
                  Open Warranty & RMA Services →
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-mono">Esc</kbd> to dismiss popup
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
