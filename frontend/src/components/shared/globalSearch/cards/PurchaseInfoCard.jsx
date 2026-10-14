import React from 'react';

/**
 * Dimension 1: Purchase Order Information Card
 */
export default function PurchaseInfoCard({ purchase, product, taka, onClose, onNavigate }) {
  return (
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
                ? new Date(purchase.purchase_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
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
  );
}
