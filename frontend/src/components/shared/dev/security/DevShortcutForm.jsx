import React, { useState } from 'react';
import {
  getDevShortcutConfig,
  saveDevShortcutConfig,
  formatShortcut,
} from '../../../../utils/devConsoleConfig';

export default function DevShortcutForm() {
  const [shortcut, setShortcut] = useState(() => getDevShortcutConfig());
  const [shortcutMsg, setShortcutMsg] = useState('');

  const handleSaveShortcut = (e) => {
    e.preventDefault();
    if (!shortcut.ctrl && !shortcut.alt && !shortcut.shift) {
      setShortcutMsg('⚠️ Please select at least one modifier key (Ctrl, Alt, or Shift).');
      return;
    }
    if (!shortcut.key) {
      setShortcutMsg('⚠️ Please specify a key (e.g. D, K, F9).');
      return;
    }
    saveDevShortcutConfig(shortcut);
    setShortcutMsg(`✓ Shortcut saved! New combination: ${formatShortcut(shortcut)}`);
    setTimeout(() => setShortcutMsg(''), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-xl">⌨️</span>
        <h4 className="text-sm font-black text-white m-0 tracking-wider">
          DEVELOPER SHORTCUT COMBINATION
        </h4>
      </div>
      <p className="text-xs text-slate-400 mt-0 mb-4">
        Customize the secret keyboard combination to trigger the developer console gate.
      </p>

      {shortcutMsg && (
        <div className="p-3 mb-4 rounded-xl text-xs font-bold bg-slate-950 border border-indigo-500/40 text-indigo-300">
          {shortcutMsg}
        </div>
      )}

      <form onSubmit={handleSaveShortcut} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={shortcut.ctrl}
              onChange={(e) => setShortcut({ ...shortcut, ctrl: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Ctrl / Cmd</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={shortcut.alt}
              onChange={(e) => setShortcut({ ...shortcut, alt: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Alt</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={shortcut.shift}
              onChange={(e) => setShortcut({ ...shortcut, shift: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Shift</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">+ Key:</span>
            <input
              type="text"
              maxLength={4}
              value={shortcut.key}
              onChange={(e) => setShortcut({ ...shortcut, key: e.target.value.toUpperCase() })}
              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-sky-400 text-xs uppercase focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-400">
            Active Trigger: <code className="text-sky-300 font-bold bg-slate-800 px-2 py-0.5 rounded">{formatShortcut(shortcut)}</code>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
          >
            Save New Shortcut
          </button>
        </div>
      </form>
    </div>
  );
}
