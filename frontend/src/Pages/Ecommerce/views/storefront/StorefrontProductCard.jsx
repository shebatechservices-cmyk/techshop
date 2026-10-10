import React, { useState } from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';
import GadgetIconPlaceholder from './GadgetIconPlaceholder';

export default function StorefrontProductCard({
  product: p,
  inCart,
  addToCart,
  buyNow,
  updateCartQty,
  taka,
}) {
  const [hasImageError, setHasImageError] = useState(false);

  const price = Number(p.selling_price || p.purchase_price || 0);
  const stock = Number(p.stock || 0);
  const isOutOfStock = stock <= 0;
  const hasImage = p.image_url && !hasImageError;
  const brand = p.brand_name || p.brand;
  const model = p.model_name || p.model;
  const category = p.category_name || p.category;
  const displayName = fullCatalogName(p) || p.name || 'Product';

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative">
      <div>
        {/* Media Wrapper */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-center p-2">
          {hasImage ? (
            <img
              src={p.image_url}
              alt={displayName}
              onError={() => setHasImageError(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <GadgetIconPlaceholder name={displayName} category={category} />
          )}

          {/* Stock Pill Badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${
                isOutOfStock
                  ? 'bg-rose-500 text-white'
                  : stock <= 5
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isOutOfStock ? 'স্টক শেষ' : stock <= 5 ? `সীমিত স্টক (${stock})` : `ইন স্টক (${stock})`}
            </span>

            {brand && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                {brand}
              </span>
            )}
          </div>

          {/* Warranty Badge if applicable */}
          {p.warranty_period && (
            <div className="absolute bottom-2 right-2 z-10">
              <span className="px-1.5 py-0.5 rounded bg-sky-500/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                <span>🛡️</span>
                <span>{p.warranty_period}</span>
              </span>
            </div>
          )}
        </div>

        {/* Category & SKU */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider truncate max-w-[130px]">
            {category || 'Electronics'}
          </span>
          <span className="font-mono text-[10px]">
            SKU: {p.sku || 'AUTO'}
          </span>
        </div>

        {/* Product Title: Complete Full Catalog Name */}
        <h3
          className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug mb-1 group-hover:text-brand transition-colors break-words min-h-[2.5rem]"
          title={displayName}
        >
          {displayName}
        </h3>

        {/* Model badge if not already in title */}
        {model && !displayName.toLowerCase().includes(model.toLowerCase()) && (
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <span>Model:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold">
              {model}
            </span>
          </div>
        )}
      </div>

      {/* Pricing & Checkout Controls */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-2">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              অফার মূল্য
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {taka ? taka(price) : `৳${price}`}
            </span>
          </div>

          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
            ক্যাশ অন ডেলিভারি
          </span>
        </div>

        {/* Cart Action Buttons */}
        {inCart ? (
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-1.5">
            <button
              type="button"
              onClick={() => updateCartQty(p.id, -1)}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-sm flex items-center justify-center hover:bg-emerald-100 cursor-pointer shadow-xs transition-colors"
              title="Reduce quantity"
            >
              −
            </button>

            <div className="text-center px-2">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block leading-tight">
                {inCart.quantity} টি কার্টে
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                {taka ? taka(inCart.quantity * inCart.price) : `৳${inCart.quantity * inCart.price}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => updateCartQty(p.id, 1)}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-sm flex items-center justify-center hover:bg-emerald-100 cursor-pointer shadow-xs transition-colors"
              title="Add more"
            >
              +
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => addToCart({ ...p, name: displayName }, false)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
              }`}
              title="Add to cart"
            >
              <span>🛒</span>
              <span>কার্ট</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => (buyNow ? buyNow({ ...p, name: displayName }) : addToCart({ ...p, name: displayName }, true))}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold text-white transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
              title="Instant Checkout"
            >
              <span>⚡</span>
              <span>কিনুন</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
