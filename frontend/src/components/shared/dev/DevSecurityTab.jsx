import React from 'react';
import DevShortcutForm from './security/DevShortcutForm';
import DevPasswordForm from './security/DevPasswordForm';
import { lockDevSession } from '../../../utils/devConsoleConfig';

export default function DevSecurityTab({ onClose }) {
  const handleLockNow = () => {
    lockDevSession();
    if (onClose) onClose();
  };

  return (
    <div className="space-y-6 max-w-3xl font-mono text-slate-200">
      {/* SECTION 1: Developer Shortcut Key Configuration */}
      <DevShortcutForm />

      {/* SECTION 2: Change Developer Entry Password */}
      <DevPasswordForm />

      {/* SECTION 3: Immediate Lock Session */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold text-slate-300">Lock Developer Console</div>
          <div className="text-[11px] text-slate-500">
            Revokes current unlocked session immediately.
          </div>
        </div>
        <button
          type="button"
          onClick={handleLockNow}
          className="px-3.5 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          🔒 Lock Session Now
        </button>
      </div>
    </div>
  );
}
