import React from 'react';

export default function ProductDetailsBanner({
  product,
  isOut,
  isLow,
  stock,
  handleCopy,
  copiedKey,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/90 items-start">
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm mx-auto sm:mx-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-3xl mb-1">📷</div>
            <div className="text-[10px] uppercase font-bold">No Image</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2 w-full">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-extrabold text-xs border ${
              isOut
                ? 'bg-red-50 text-red-700 border-red-200'
                : isLow
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
            {isOut ? 'Out of Stock' : isLow ? `Low Stock (${stock} pcs)` : `In Stock (${stock} pcs)`}
          </span>

          {/* Category & Subcategory */}
          {(product.category_name || product.sub_category_name) && (
            <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
              <span>📁</span>
              {product.category_name || 'General'}
              {product.sub_category_name ? ` › ${product.sub_category_name}` : ''}
            </span>
          )}

          {/* E-Commerce Status */}
          <span
            className={`inline-flex items-center gap-1 py-1 px-2 rounded text-[0.7rem] font-bold ${
              product.is_ecommerce_active !== false
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            🛒 E-Com: {product.is_ecommerce_active !== false ? 'Live' : 'Hidden'}
          </span>
        </div>

        {/* SKU & Barcode Pills with Quick Copy */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {product.sku && (
            <button
              type="button"
              onClick={() => handleCopy(product.sku, 'sku')}
              className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-mono text-xs font-bold transition-colors text-left"
              title="Click to copy SKU"
            >
              <span>SKU: {product.sku}</span>
              <span className="text-[10px]">{copiedKey === 'sku' ? '✓ Copied' : '📋'}</span>
            </button>
          )}

          {product.barcode && (
            <button
              type="button"
              onClick={() => handleCopy(product.barcode, 'barcode')}
              className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-mono text-xs font-bold transition-colors text-left"
              title="Click to copy Barcode"
            >
              <span>Barcode: {product.barcode}</span>
              <span className="text-[10px]">{copiedKey === 'barcode' ? '✓ Copied' : '📋'}</span>
            </button>
          )}
        </div>

        {/* Hierarchy badges (Brand, Model, Series) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-0.5">
          {product.brand_name && (
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
              Brand: <strong className="text-slate-800">{product.brand_name}</strong>
            </span>
          )}
          {product.model_name && (
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
              Model: <strong className="text-slate-800">{product.model_name}</strong>
            </span>
          )}
          {product.series_name && (
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
              Series: <strong className="text-slate-800">{product.series_name}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
