import React, { useEffect } from 'react';

export default function SaleDetailDrawer({
  isOpen,
  onClose,
  sale,
  loading = false,
  onPrint,
  onEdit,
  onCollectDue,
  taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const due = Number(sale?.due_amount || 0);
  const paid = Number(sale?.paid_amount || 0);
  const grandTotal = Number(sale?.total_amount || sale?.grand_total || 0);
  const discount = Number(sale?.discount_amount || sale?.discount || 0);
  const subtotal = grandTotal + discount;

  const getStatusBadge = () => {
    const status = String(sale?.payment_status || '').toUpperCase();
    if (status === 'PAID' || due <= 0) {
      return {
        label: 'PAID',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (status === 'PARTIAL' || (paid > 0 && due > 0)) {
      return {
        label: 'PARTIAL',
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    return {
      label: 'DUE',
      bg: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
          {/* Header */}
          <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl">🧾</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {sale?.invoice_no || `INV-${sale?.id}`}
                  </h2>
                  <span
                    className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {sale?.created_at
                    ? new Date(sale.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent Sale'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Close drawer (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onPrint && (
                <button
                  type="button"
                  onClick={() => onPrint(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <span>🖨️</span> Print Invoice
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <span>✏️</span> Edit Sale
                </button>
              )}

              {onCollectDue && (due > 0 || Number(sale?.customer_receivable_balance || 0) > 0) && (
                <button
                  type="button"
                  onClick={() => onCollectDue(sale)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
                >
                  <span>💳</span> Collect Due
                </button>
              )}
            </div>

            <span className="text-[0.7rem] text-slate-400">Quick View</span>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
            {loading ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading complete invoice details...</p>
              </div>
            ) : !sale ? (
              <div className="text-center py-16 text-slate-400">No sale selected</div>
            ) : (
              <>
                {/* Customer Information Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Information
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {sale.customer_name || 'Walk-in Customer'}
                      </div>
                      {sale.customer_phone && (
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <span>📞</span> {sale.customer_phone}
                        </div>
                      )}
                      {sale.customer_address && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>📍</span> {sale.customer_address}
                        </div>
                      )}
                    </div>

                    {sale.customer_receivable_balance !== undefined && (
                      <div className="text-right">
                        <span className="text-[0.68rem] text-slate-500 block">Total Due</span>
                        <span className="text-xs font-extrabold text-rose-600 block">
                          {taka(sale.customer_receivable_balance)}
                        </span>
                        {onCollectDue && Number(sale.customer_receivable_balance) > 0 && (
                          <button
                            type="button"
                            onClick={() => onCollectDue(sale)}
                            className="inline-block mt-0.5 text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                          >
                            Collect Due
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items & Serials List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Purchased Items ({sale.items?.length || 0})
                    </span>
                    <span className="text-[0.7rem] text-slate-400">
                      Units: {sale.unit_count || sale.items?.reduce((sum, it) => sum + Number(it.quantity || 1), 0) || 0}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {Array.isArray(sale.items) && sale.items.length > 0 ? (
                      sale.items.map((item, idx) => {
                        const itemQty = Number(item.quantity || 1);
                        const itemPrice = Number(item.unit_price || item.sale_price || item.price || 0);
                        const itemLineTotal = Number(item.line_total || item.total_price || itemQty * itemPrice);
                        const warranty = item.warranty_months || 0;
                        const serials = Array.isArray(item.serials) ? item.serials : [];

                        return (
                          <div key={item.id || idx} className="p-3 hover:bg-slate-50/60 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="font-bold text-slate-900 text-xs">
                                  {item.product_name || item.name || 'Product'}
                                </div>
                                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                                  {itemQty} × {taka(itemPrice)}
                                </div>
                              </div>
                              <div className="font-extrabold text-slate-900 text-xs text-right">
                                {taka(itemLineTotal)}
                              </div>
                            </div>

                            {/* Badges: Warranty & Serials */}
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              {warranty > 0 && (
                                <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                                  <span>🛡️</span> {warranty} Mos Warranty
                                </span>
                              )}

                              {serials.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {serials.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="inline-flex items-center gap-0.5 text-[0.66rem] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                                    >
                                      <span>🏷️</span> {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Item details not available in this view
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Breakdown Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                    Financial Summary
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-800">{taka(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between items-center text-rose-600">
                        <span>Discount:</span>
                        <span className="font-bold">- {taka(discount)}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span>{taka(grandTotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-700">
                      <span>Paid Amount:</span>
                      <span className="font-bold">{taka(paid)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 font-extrabold">
                      <span className={due > 0 ? 'text-rose-600' : 'text-slate-700'}>
                        Remaining Due:
                      </span>
                      <span className={due > 0 ? 'text-rose-600 text-sm' : 'text-emerald-600'}>
                        {due > 0 ? taka(due) : 'No Due (Cleared)'}
                      </span>
                    </div>

                    {onCollectDue && due > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onCollectDue(sale)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                        >
                          <span>💳</span> Settle / Collect Due ({taka(due)})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods & Notes */}
                {(sale.payment_method || sale.notes || sale.reference_no) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                      Additional Information
                    </div>
                    {sale.payment_method && (
                      <div className="flex justify-between text-slate-700">
                        <span className="text-slate-500">Payment Method:</span>
                        <span className="font-bold">{sale.payment_method}</span>
                      </div>
                    )}
                    {sale.reference_no && (
                      <div className="flex justify-between text-slate-700">
                        <span className="text-slate-500">Reference:</span>
                        <span className="font-mono">{sale.reference_no}</span>
                      </div>
                    )}
                    {sale.notes && (
                      <div className="pt-1 text-slate-600">
                        <span className="text-slate-500 block mb-0.5">Notes:</span>
                        <p className="bg-white p-2 rounded border border-slate-200 italic">{sale.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
