import React, { useEffect } from 'react';
import { fullCatalogName } from '../../../utils/productUtils';

export default function PurchaseDetailDrawer({
  isOpen,
  onClose,
  order,
  loading = false,
  onPrint,
  onEdit,
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

  const totalCost = Number(order?.total_cost || 0);
  const totalPaid = Number(order?.total_paid || 0);
  const totalDue = Number(order?.total_due || 0);
  const extraCost = Number(order?.extra_cost || 0);
  const discount = Number(order?.discount || 0);
  const goodsCost = Array.isArray(order?.items)
    ? order.items.reduce(
        (sum, it) => sum + Number(it.cost_price || 0) * Math.max(1, Number(it.quantity || 1)),
        0
      )
    : totalCost;

  const getStatusBadge = () => {
    const status = String(order?.status || '').toUpperCase();
    if (status === 'PAID' || totalDue <= 0) {
      return {
        label: 'PAID',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (status === 'PARTIAL' || (totalPaid > 0 && totalDue > 0)) {
      return {
        label: 'PARTIAL',
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    return {
      label: order?.status || 'APPROVED',
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
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
              <span className="text-xl">🛒</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {order?.po_number || `PO-${order?.id}`}
                  </h2>
                  <span
                    className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {order?.created_at
                    ? new Date(order.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent Purchase Order'}
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
                  onClick={() => onPrint(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-bold hover:bg-sky-100 transition-colors"
                >
                  <span>🖨️</span> Print Voucher
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  <span>✏️</span> Edit Order
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
                <p className="text-xs">Loading complete order details...</p>
              </div>
            ) : !order ? (
              <div className="text-center py-16 text-slate-400">No purchase order selected</div>
            ) : (
              <>
                {/* Supplier Information Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                    Supplier Information
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {order.supplier_name || `Supplier #${order.supplier_id}`}
                      </div>
                      {order.supplier_phone && (
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <span>📞</span> {order.supplier_phone}
                        </div>
                      )}
                      {order.supplier_address && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>📍</span> {order.supplier_address}
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      {order.supplier_payable_balance !== undefined && (
                        <div>
                          <span className="text-[0.68rem] text-slate-500 block">Payable Balance</span>
                          <span className="text-xs font-extrabold text-rose-600">
                            {taka(order.supplier_payable_balance)}
                          </span>
                        </div>
                      )}
                      {Number(order.supplier_wallet_balance || 0) > 0 && (
                        <div>
                          <span className="text-[0.68rem] text-slate-500 block">Wallet</span>
                          <span className="text-xs font-bold text-emerald-600">
                            {taka(order.supplier_wallet_balance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items & Serials List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Purchased Products ({order.items?.length || 0})
                    </span>
                    <span className="text-[0.7rem] text-slate-400">
                      Units: {order.unit_count || order.items?.reduce((sum, it) => sum + Number(it.quantity || 1), 0) || 0}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => {
                        const itemQty = Number(item.quantity || 1);
                        const itemCost = Number(item.cost_price || 0);
                        const finalCost = Number(item.final_cost || itemCost);
                        const itemLineTotal = Number(item.line_total || itemQty * itemCost);
                        const serials = Array.isArray(item.serials) ? item.serials : [];
                        const suppWarranty = item.supplier_warranty_months || item.warranty_months || 0;
                        const custWarranty = item.customer_warranty_months || item.warranty_months || 0;

                        return (
                          <div key={item.id || idx} className="p-3 hover:bg-slate-50/60 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="font-bold text-slate-900 text-xs">
                                  {item.full_name || item.name || fullCatalogName(item) || item.product_name || 'Product'}
                                </div>
                                {item.sku && (
                                  <div className="text-[0.68rem] text-slate-400 font-mono mt-0.5">
                                    SKU: {item.sku}
                                  </div>
                                )}
                                <div className="text-[0.7rem] text-slate-500 mt-0.5">
                                  {itemQty} × {taka(itemCost)}
                                  {finalCost > itemCost && (
                                    <span className="ml-1.5 text-orange-600 font-semibold">
                                      (Final Cost: {taka(finalCost)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="font-extrabold text-slate-900 text-xs text-right">
                                {taka(itemLineTotal)}
                              </div>
                            </div>

                            {/* Warranty & Serials Badges */}
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              {suppWarranty > 0 && (
                                <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                  <span>🏭</span> Supplier: {suppWarranty}m
                                </span>
                              )}

                              {custWarranty > 0 && (
                                <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                                  <span>🛡️</span> Customer: {custWarranty}m
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

                {/* Logistics / Extra Cost Card (If Present) */}
                {extraCost > 0 && (
                  <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-950 flex items-center gap-1">
                        <span>🚚</span> Logistics &amp; Transport (Expense)
                      </span>
                      <span className="font-extrabold text-sm text-orange-800">
                        +{taka(extraCost)}
                      </span>
                    </div>

                    <div className="text-xs text-orange-900/80 flex items-center gap-2">
                      <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[0.68rem] font-semibold">
                        {order.extra_cost_category || 'Transportation & Logistics'}
                      </span>
                      {order.extra_cost_notes && (
                        <span className="italic text-[0.72rem]">"{order.extra_cost_notes}"</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                    Financial Summary
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Goods Subtotal:</span>
                      <span className="font-bold text-slate-800">{taka(goodsCost)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between items-center text-rose-600">
                        <span>Less Discount:</span>
                        <span className="font-bold">- {taka(discount)}</span>
                      </div>
                    )}

                    {extraCost > 0 && (
                      <div className="flex justify-between items-center text-orange-800">
                        <span>Landed Extra Cost:</span>
                        <span className="font-bold">+{taka(extraCost)}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
                      <span>Total Cost:</span>
                      <span>{taka(totalCost)}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-700">
                      <span>Total Paid:</span>
                      <span className="font-bold">{taka(totalPaid)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 font-extrabold">
                      <span className={totalDue > 0 ? 'text-rose-600' : 'text-slate-700'}>
                        Outstanding Due:
                      </span>
                      <span className={totalDue > 0 ? 'text-rose-600 text-sm' : 'text-emerald-600'}>
                        {totalDue > 0 ? taka(totalDue) : 'No Due (Cleared)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment History / Accounts */}
                {Array.isArray(order.payments) && order.payments.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
                      Payment Records ({order.payments.length})
                    </div>
                    <div className="divide-y divide-slate-200/80">
                      {order.payments.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="py-1.5 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">
                              {p.account_name || p.payment_method || 'Payment'}
                            </span>
                            {p.transaction_id && (
                              <span className="text-[0.68rem] text-slate-500 font-mono ml-1.5">
                                ({p.transaction_id})
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-emerald-700">{taka(p.amount)}</span>
                        </div>
                      ))}
                    </div>
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
