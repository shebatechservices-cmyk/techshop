import React from 'react';

export default function PrintLivePreviewPanel({ settings, previewMode, setPreviewMode }) {
  return (
    <div className="sticky top-4">
      <div className="bg-slate-900 text-white rounded-t-lg px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Live Preview ({previewMode === 'thermal' ? '80mm POS Thermal' : 'Standard A4 Invoice'})
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPreviewMode('a4')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              previewMode === 'a4' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            A4
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('thermal')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              previewMode === 'thermal' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Thermal
          </button>
        </div>
      </div>

      {previewMode === 'thermal' ? (
        <div className="bg-white border border-slate-300 rounded-b-lg p-4 font-mono text-xs text-slate-900 shadow-md space-y-2">
          <div className="text-center border-b border-dashed border-slate-300 pb-2">
            <strong className="text-sm block">{settings.shop_name || 'Sheba Technology'}</strong>
            <div className="text-[10px] text-slate-500">{settings.shop_title || 'IT & CCTV Solutions'}</div>
            <div className="text-[10px] text-slate-500">{settings.address || 'Dhaka, Bangladesh'}</div>
            <div className="text-[11px] font-bold mt-0.5">Hotline: {settings.phone || '+880 1700-000000'}</div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-600">
            <span>INV #INV-9812</span>
            <span>{new Date().toLocaleDateString('en-GB')}</span>
          </div>

          <div className="border-b border-dashed border-slate-300 pb-2 space-y-1 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>Item</span>
              <span>Total</span>
            </div>
            <div className="flex justify-between">
              <span>Hikvision 2MP IP Cam x 2</span>
              <span>৳4,800</span>
            </div>
            <div className="flex justify-between">
              <span>Cat6 Network Cable x 1</span>
              <span>৳6,500</span>
            </div>
          </div>

          <div className="text-right border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-0.5">
            <div>Subtotal: ৳11,300</div>
            <div>Discount: -৳300</div>
            <div className="font-bold text-xs text-slate-900">Net Payable: ৳11,000</div>
            <div className="text-emerald-700 font-semibold">Paid: ৳11,000 | Due: ৳0</div>
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
            <div>{settings.invoice_footer_note || 'Thank you for shopping with us!'}</div>
            <div className="text-slate-400 text-[9px]">{settings.invoice_terms || 'Warranty valid only with original invoice.'}</div>
          </div>
        </div>
      ) : (
        /* A4 Real-Time Preview */
        <div className="bg-white border border-slate-300 rounded-b-lg p-4 text-[11px] text-slate-900 shadow-md relative overflow-hidden space-y-3">
          {/* Watermark */}
          {settings.enable_watermark !== false && (settings.watermark_logo_url || settings.logo_url) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: (Number(settings.watermark_opacity) || 6) / 100 }}>
              <img
                src={settings.watermark_logo_url || settings.logo_url}
                alt="Watermark"
                className="w-44 h-44 object-contain grayscale"
              />
            </div>
          )}

          <div className="relative z-10 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-9 max-w-[70px] object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                    ST
                  </div>
                )}
                <div>
                  <strong className="text-sm text-slate-900 block leading-tight">{settings.shop_name || 'Sheba Technology'}</strong>
                  <div className="text-[10px] font-semibold text-blue-600">{settings.shop_title || 'IT & CCTV Solutions'}</div>
                  <div className="text-[10px] text-slate-500">{settings.address} • Hotline: {settings.phone}</div>
                </div>
              </div>

              {settings.show_sister_concern !== false && (
                <div className="text-right">
                  {settings.secondary_logo_url ? (
                    <img src={settings.secondary_logo_url} alt="Secondary" className="h-7 max-w-[70px] object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600">{settings.sister_concern_name || 'Sheba Group'}</span>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center">
              <span className="inline-block border border-slate-900 bg-slate-50 px-3 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider">
                Sales Invoice
              </span>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 border border-slate-300 rounded text-[10px]">
              <div className="p-2 border-r border-slate-300">
                <strong className="text-blue-600 block text-[9px] uppercase">Customer Details</strong>
                <div><strong>Customer:</strong> Apex Enterprises</div>
                <div><strong>Mobile:</strong> 01711-223344</div>
              </div>
              <div className="p-2">
                <strong className="text-blue-600 block text-[9px] uppercase">Invoice Details</strong>
                <div><strong>Invoice #:</strong> INV-2026-9812</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
              </div>
            </div>

            {/* Items */}
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-1.5 py-1 text-left">Description</th>
                  <th className="border border-slate-300 px-1 py-1 text-center w-14">Warranty</th>
                  <th className="border border-slate-300 px-1 py-1 text-right w-10">Qty</th>
                  <th className="border border-slate-300 px-1.5 py-1 text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-1.5 py-1">
                    <strong>Hikvision 2MP IP Bullet Cam</strong>
                    <div className="text-[9px] text-blue-600">S/N: HK-9811, HK-9812</div>
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">2 YRS</td>
                  <td className="border border-slate-300 px-1 py-1 text-right">2</td>
                  <td className="border border-slate-300 px-1.5 py-1 text-right font-bold">৳4,800</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1.5 py-1">
                    <strong>Cat6 Pure Copper Cable Drum</strong>
                    <div className="text-[9px] text-blue-600">S/N: CAB-305M</div>
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-center">1 YR</td>
                  <td className="border border-slate-300 px-1 py-1 text-right">1</td>
                  <td className="border border-slate-300 px-1.5 py-1 text-right font-bold">৳6,500</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end text-[10px]">
              <div className="w-48 border border-slate-300 rounded p-1.5 bg-slate-50 space-y-0.5">
                <div className="flex justify-between"><span>Subtotal:</span><span>৳11,300</span></div>
                <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-৳300</span></div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-xs text-blue-700">
                  <span>Net Payable:</span><span>৳11,000</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Paid:</span><span>৳11,000</span>
                </div>
              </div>
            </div>

            {/* Signatures & Footer details */}
            {settings.show_footer_details !== false && (
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex justify-between text-[10px] text-slate-500 pt-4">
                  <div className="border-t border-dashed border-slate-400 w-24 text-center">Customer Sign</div>
                  <div className="text-center font-bold text-slate-700 text-[9px]">Computer Generated Bill</div>
                  <div className="border-t border-dashed border-slate-400 w-24 text-center">Authorized Sign</div>
                </div>

                {/* Brand logos row */}
                {(Array.isArray(settings.invoice_brand_logos) ? settings.invoice_brand_logos : []).length > 0 && (
                  <div className="flex items-center justify-center flex-wrap gap-2 pt-1 border-t border-slate-200">
                    {(Array.isArray(settings.invoice_brand_logos) ? settings.invoice_brand_logos : []).map((brand, idx) => (
                      <div key={idx} className="flex items-center">
                        {brand.url ? (
                          <img src={brand.url} alt={brand.name || ''} className="h-3.5 max-w-[45px] object-contain" />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600">{brand.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
