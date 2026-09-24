import React from 'react';

export default function WarrantyModal({
  product,
  warrantyData,
  onClose,
}) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[99999] p-5 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[750px] w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-slate-200 pb-3.5 mb-4.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h2 className="m-0 text-xl text-slate-900 font-extrabold">
                Warranty & Serial Numbers
              </h2>
            </div>
            <p className="mt-1 mb-0 text-slate-500 text-sm">
              {product.composite_name || product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-2xl text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Product Meta Stats */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5 mb-4.5">
          <div className="bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100">
            <span className="text-[0.72rem] text-slate-500 uppercase font-bold">Supplier Warranty</span>
            <div className="text-base font-extrabold text-indigo-700">
              {(product.supplier_warranty_months || product.warranty_months) ? `${product.supplier_warranty_months || product.warranty_months} Months` : 'None / 0m'}
            </div>
          </div>
          <div className="bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100">
            <span className="text-[0.72rem] text-slate-500 uppercase font-bold">Supplier Expiry Date</span>
            <div className={`text-base font-extrabold ${(product.aging_days >= 60) ? 'text-red-600' : 'text-sky-700'}`}>
              {product.supplier_warranty_expire_date ? new Date(product.supplier_warranty_expire_date).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100">
            <span className="text-[0.72rem] text-slate-500 uppercase font-bold">Inventory Aging</span>
            <div className={`text-base font-extrabold ${(product.aging_days >= 60) ? 'text-red-600' : 'text-green-600'}`}>
              {product.aging_days !== undefined ? `${product.aging_days} Days` : '0 Days'}
              {product.aging_days >= 60 && <span className="text-xs ml-1">⚠️</span>}
            </div>
          </div>
          <div className="bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100">
            <span className="text-[0.72rem] text-slate-500 uppercase font-bold">Tracked Serials</span>
            <div className="text-base font-extrabold text-sky-600">
              {warrantyData?.serials?.length || 0} serials
            </div>
          </div>
        </div>

        {/* Serials Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[0.74rem] uppercase">
                <th className="py-2 px-3 text-left">Serial Number</th>
                <th className="py-2 px-3 text-left">Purchase PO</th>
                <th className="py-2 px-3 text-left">Supplier</th>
                <th className="py-2 px-3 text-left">Supplier Exp</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-left">Sale Invoice</th>
              </tr>
            </thead>
            <tbody>
              {warrantyData?.loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    Loading serial warranty records...
                  </td>
                </tr>
              ) : !warrantyData?.serials || warrantyData.serials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-7 px-4 text-slate-500">
                    <div className="text-2xl mb-1.5">🏷️</div>
                    <div className="font-semibold text-slate-700">No individual serials registered for this product</div>
                    <p className="text-xs mt-1 mb-0 text-slate-400">
                      Serials are automatically registered when purchase orders with barcode scans are completed.
                    </p>
                  </td>
                </tr>
              ) : (
                warrantyData.serials.map((s) => (
                  <tr key={s.serial_id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {s.serial_code}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {s.po_number || 'Initial'}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {s.supplier_name || 'Vendor'}
                    </td>
                    <td className="py-2 px-3 text-sky-700 text-xs font-semibold">
                      {s.supplier_warranty_expire_date ? new Date(s.supplier_warranty_expire_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`py-0.5 px-2 rounded text-[0.72rem] font-bold ${
                          s.status === 'Sold' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sky-600">
                      {s.sale_invoice_no || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
