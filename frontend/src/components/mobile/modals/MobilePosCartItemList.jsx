import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobilePosCartItemList({
  cart,
  updateQuantity,
  removeFromCart,
}) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
        আইটেম তালিকা ({cart.length})
      </span>
      {cart.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          উপরের সার্চ বা ক্যামেরা আইকন দিয়ে পণ্য যোগ করুন
        </div>
      ) : (
        cart.map((item) => (
          <div
            key={item.product.id}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate m-0">
                {item.product.name}
              </h5>
              <span className="text-[10px] text-slate-500">
                {taka(item.unit_price)} × {item.quantity} = {taka(item.unit_price * item.quantity)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateQuantity(item.product.id, -1)}
                className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-sm flex items-center justify-center active:scale-95"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.product.id, 1)}
                className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center active:scale-95"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
