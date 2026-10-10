import React from 'react';

export default function PrintFormatClauseSection({ settings, setSettings, setPreviewMode }) {
  return (
    <>
      {/* Print Page Geometry & Layout Preferences */}
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

      {/* Text & Policy Fields */}
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
    </>
  );
}
