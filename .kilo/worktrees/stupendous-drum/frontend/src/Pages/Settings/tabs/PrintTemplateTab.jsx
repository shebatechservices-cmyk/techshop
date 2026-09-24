import React from 'react';

export default function PrintTemplateTab({
  settings,
  setSettings,
  saving,
  handleSavePrintDesign,
  handleGenericImageUpload,
  handleBrandLogoFileUpload,
  handleMoveBrandLogo,
  handleAddBrandLogo,
  handleUpdateBrandLogo,
  handleRemoveBrandLogo,
  previewMode,
  setPreviewMode
}) {
  return (
    <div className="space-y-5">
      {/* Sub-page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Print Templates</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🖨️</span> Invoice Design & Print Templates
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure A4/A5 invoices, POS thermal slips, primary/secondary logos, watermarks, brand strips, and policy clauses.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSavePrintDesign}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Saving...' : 'Save Print Design'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Header & Watermark Branding */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span>🎨</span> Store Header & Watermark Branding
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary Shop Logo */}
              <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 mb-2">Primary Logo</span>
                <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Shop Logo" className="max-h-12 max-w-[90%] object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="flex gap-1.5 w-full">
                  <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
                    Upload
                    <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'logo_url')} className="hidden" />
                  </label>
                  {settings.logo_url && (
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, logo_url: '' }))}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                      title="Remove Logo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary / Sister Concern Logo */}
              <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 mb-2">Secondary Logo</span>
                <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
                  {settings.secondary_logo_url ? (
                    <img src={settings.secondary_logo_url} alt="Secondary Logo" className="max-h-12 max-w-[90%] object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400">No Secondary</span>
                  )}
                </div>
                <div className="flex gap-1.5 w-full">
                  <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
                    Upload
                    <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'secondary_logo_url')} className="hidden" />
                  </label>
                  {settings.secondary_logo_url && (
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, secondary_logo_url: '' }))}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                      title="Remove Secondary Logo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Centered Watermark Logo */}
              <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center text-center bg-slate-50/50">
                <span className="text-xs font-bold text-slate-700 mb-2">Watermark Logo</span>
                <div className="w-full h-14 bg-white border border-slate-200 rounded flex items-center justify-center mb-2 overflow-hidden">
                  {(settings.watermark_logo_url || settings.logo_url) ? (
                    <img
                      src={settings.watermark_logo_url || settings.logo_url}
                      alt="Watermark Logo"
                      className="max-h-12 max-w-[90%] object-contain"
                      style={{ opacity: (Number(settings.watermark_opacity) || 6) / 20 }}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Uses Main Logo</span>
                  )}
                </div>
                <div className="flex gap-1.5 w-full">
                  <label className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer text-center transition-colors">
                    Custom
                    <input type="file" accept="image/*" onChange={(e) => handleGenericImageUpload(e, 'watermark_logo_url')} className="hidden" />
                  </label>
                  {settings.watermark_logo_url && (
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, watermark_logo_url: '' }))}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded transition-colors"
                      title="Reset to default logo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subtitle & Watermark Opacity Controls */}
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sister Concern / Header Subtitle
                </label>
                <input
                  type="text"
                  value={settings.sister_concern_name || ''}
                  onChange={(e) => setSettings({ ...settings, sister_concern_name: e.target.value })}
                  placeholder="e.g. A Sister Concern Of Sheba Group"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_sister_concern !== false}
                    onChange={(e) => setSettings({ ...settings, show_sister_concern: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Show Sister Concern on Invoice
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Watermark Opacity: {Number(settings.watermark_opacity) || 6}%
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enable_watermark !== false}
                      onChange={(e) => setSettings({ ...settings, enable_watermark: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Enabled
                  </label>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={Number(settings.watermark_opacity) || 6}
                  onChange={(e) => setSettings({ ...settings, watermark_opacity: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>3% (Faint)</span>
                  <span>6% (Optimal)</span>
                  <span>15% (Bold)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Print Page Geometry & Layout Preferences */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span>📐</span> Print Page Geometry & Formatting
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Paper Format
                </label>
                <select
                  value={settings.paper_size || (settings.default_invoice_format === 'thermal_80mm' ? 'thermal_80mm' : (settings.default_invoice_format === 'a5_invoice' ? 'a5' : 'a4'))}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({
                      ...settings,
                      paper_size: val,
                      default_invoice_format: val === 'thermal_80mm' ? 'thermal_80mm' : (val === 'a5' ? 'a5_invoice' : 'a4_invoice')
                    });
                    setPreviewMode(val === 'thermal_80mm' ? 'thermal' : 'a4');
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="a4">Standard A4 (210 × 297 mm)</option>
                  <option value="a5">Compact A5 Half (148 × 210 mm)</option>
                  <option value="thermal_80mm">80mm POS Thermal Slip</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Margin
                </label>
                <select
                  value={settings.page_margin || 'default'}
                  onChange={(e) => setSettings({ ...settings, page_margin: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default / Standard (8mm)</option>
                  <option value="0.5in">Compact 0.5 Inch (12.7 mm)</option>
                  <option value="1in">Spacious 1.0 Inch (25.4 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invoice Accent Palette
                </label>
                <select
                  value={settings.invoice_color_scheme || 'slate'}
                  onChange={(e) => setSettings({ ...settings, invoice_color_scheme: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="slate">Minimalist Charcoal / Slate</option>
                  <option value="blue">Corporate Royal Blue</option>
                  <option value="emerald">Modern Emerald Green</option>
                </select>
              </div>
            </div>

            {/* Footer Details & Signature Toggle */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Show Bottom Signatures & Footer Blocks
                </span>
                <span className="text-[11px] text-slate-500">
                  Includes Customer Signature, Authorized Signature line, Computer Generated note, and Brand Strips.
                </span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_footer_details !== false && settings.show_signature_on_invoice !== false}
                  onChange={(e) => setSettings({
                    ...settings,
                    show_footer_details: e.target.checked,
                    show_signature_on_invoice: e.target.checked
                  })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  {(settings.show_footer_details !== false && settings.show_signature_on_invoice !== false) ? 'Visible' : 'Hidden'}
                </span>
              </label>
            </div>
          </div>

          {/* 3. Text & Policy Fields */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>📝</span> Invoice Terms & Policy Clauses
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Invoice Footer Greeting / Note
              </label>
              <input
                type="text"
                value={settings.invoice_footer_note || settings.footer_greeting || ''}
                onChange={(e) => setSettings({ ...settings, invoice_footer_note: e.target.value, footer_greeting: e.target.value })}
                placeholder="Thank you for your business! Please visit again."
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return & Exchange Policy (A4 Left Column)
                </label>
                <textarea
                  rows="3"
                  value={settings.return_refund_policy || settings.return_policy_text || ''}
                  onChange={(e) => setSettings({ ...settings, return_refund_policy: e.target.value, return_policy_text: e.target.value })}
                  placeholder="• No cash refund after sale.&#10;• Goods exchangeable within 3 days with receipt."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Warranty Disclaimer Notice
                </label>
                <textarea
                  rows="3"
                  value={settings.warranty_policy || settings.warranty_disclaimer_text || ''}
                  onChange={(e) => setSettings({ ...settings, warranty_policy: e.target.value, warranty_disclaimer_text: e.target.value })}
                  placeholder="Warranty Void if physical damage, burn, broken seal, or adapter defect is found."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                POS Thermal Terms & Conditions (Thermal Slip Footnote)
              </label>
              <textarea
                rows="2"
                value={settings.invoice_terms || settings.thermal_tc_clause || ''}
                onChange={(e) => setSettings({ ...settings, invoice_terms: e.target.value, thermal_tc_clause: e.target.value })}
                placeholder="1. Must produce receipt for warranty claims. 2. Electrical burn void warranty."
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Authorized Brand Partner Logos */}
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
                disabled={(Array.isArray(settings.invoice_brand_logos) ? settings.invoice_brand_logos.length : 0) >= 12}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-bold transition-colors"
              >
                + Add Brand
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Array.isArray(settings.invoice_brand_logos) ? settings.invoice_brand_logos : []).map((brand, idx) => (
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
                        disabled={idx === (settings.invoice_brand_logos?.length || 0) - 1}
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
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5">
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
        </div>
      </div>
    </div>
  );
}
