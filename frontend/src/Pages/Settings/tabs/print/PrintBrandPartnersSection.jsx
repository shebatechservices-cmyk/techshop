import React from 'react';

export default function PrintBrandPartnersSection({
  settings,
  handleAddBrandLogo,
  handleMoveBrandLogo,
  handleRemoveBrandLogo,
  handleBrandLogoFileUpload,
  handleUpdateBrandLogo,
}) {
  const brandLogos = Array.isArray(settings.invoice_brand_logos) ? settings.invoice_brand_logos : [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span>🏷️</span> Authorized Brand Partner Logos (Max 12)
          </h4>
          <p className="text-[11px] text-slate-500">
            Displayed in a neat row at the bottom of standard A4 invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddBrandLogo}
          disabled={brandLogos.length >= 12}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors"
        >
          + Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {brandLogos.map((brand, idx) => (
          <div key={idx} className="border border-slate-200 rounded-md p-2.5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleMoveBrandLogo(idx, -1)}
                  disabled={idx === 0}
                  className="px-1.5 py-0.5 border border-slate-300 rounded text-xs disabled:opacity-30 bg-white"
                  title="Move Left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveBrandLogo(idx, 1)}
                  disabled={idx === brandLogos.length - 1}
                  className="px-1.5 py-0.5 border border-slate-300 rounded text-xs disabled:opacity-30 bg-white"
                  title="Move Right"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBrandLogo(idx)}
                className="text-rose-600 hover:text-rose-800 text-xs font-bold px-1.5 py-0.5"
                title="Remove Brand"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-9 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                {brand.url ? (
                  <img src={brand.url} alt={brand.name || 'Brand'} className="max-h-7 max-w-[40px] object-contain" />
                ) : (
                  <span className="text-[9px] text-slate-400">No Image</span>
                )}
              </div>
              <label className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                Upload
                <input type="file" accept="image/*" onChange={(e) => handleBrandLogoFileUpload(e, idx)} className="hidden" />
              </label>
            </div>

            <input
              type="text"
              value={brand.name || ''}
              onChange={(e) => handleUpdateBrandLogo(idx, 'name', e.target.value)}
              placeholder="Brand Name (e.g. Hikvision)"
              className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
