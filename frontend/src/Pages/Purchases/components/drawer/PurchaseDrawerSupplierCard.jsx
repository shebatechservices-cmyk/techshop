import React from 'react';

export default function PurchaseDrawerSupplierCard({ order, taka }) {
  if (!order) return null;

  return (
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
  );
}
