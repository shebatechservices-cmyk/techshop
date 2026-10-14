import React from 'react';

export default function SmsTriggerCard({
  trig,
  onToggle,
  onTemplateChange,
  onInsertToken,
  onOpenSamplePreview,
}) {
  const charCount = (trig.template_bn || '').length;
  const smsCount = Math.ceil(charCount / 160) || 1;
  const tokensArray = (trig.available_tokens || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm transition-all flex flex-col justify-between ${
        trig.is_enabled
          ? 'bg-white border-slate-300'
          : 'bg-slate-50 border-slate-200 opacity-60'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {trig.category}
              </span>
              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                👤 {trig.recipient_type}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {trig.trigger_name}
            </h4>
          </div>

          <input
            type="checkbox"
            checked={trig.is_enabled}
            onChange={() => onToggle(trig.trigger_key)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

        {/* Template Textarea */}
        <textarea
          rows="3"
          value={trig.template_bn || ''}
          onChange={(e) => onTemplateChange(trig.trigger_key, e.target.value)}
          disabled={!trig.is_enabled}
          placeholder="Enter template notification message..."
          className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed mb-2 disabled:bg-slate-100"
        />

        {/* Dynamic Tokens */}
        <div className="mb-3">
          <span className="text-[10px] text-slate-500 block mb-1 font-medium">
            Click to insert dynamic token:
          </span>
          <div className="flex flex-wrap gap-1">
            {tokensArray.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => onInsertToken(trig.trigger_key, token)}
                disabled={!trig.is_enabled}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span>
          {charCount} chars (~{smsCount} SMS)
        </span>
        <button
          type="button"
          onClick={() => onOpenSamplePreview(trig)}
          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
        >
          👁️ Sample Preview
        </button>
      </div>
    </div>
  );
}
