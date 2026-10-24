import React, { useState } from 'react';
import { changeDevPassword } from '../../../../utils/devConsoleConfig';

export default function DevPasswordForm() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', isError: false });
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ text: '', isError: false });

    if (!currentPass) {
      setPassMsg({ text: 'Please enter current developer password.', isError: true });
      return;
    }
    if (!newPass || newPass.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await changeDevPassword(currentPass, newPass);
      if (res.success) {
        setPassMsg({ text: '✓ ' + res.message, isError: false });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassMsg({ text: '⚠️ ' + res.message, isError: true });
      }
    } catch (err) {
      setPassMsg({ text: 'Error: ' + err.message, isError: true });
    } finally {
      setUpdatingPass(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-xl">🔐</span>
        <h4 className="text-sm font-black text-white m-0 tracking-wider">
          CHANGE DEVELOPER ENTRY PASSWORD
        </h4>
      </div>
      <p className="text-xs text-slate-400 mt-0 mb-4">
        Set a master password required before the developer console unlocks.
      </p>

      {passMsg.text && (
        <div
          className={`p-3 mb-4 rounded-xl text-xs font-bold ${
            passMsg.isError
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {passMsg.text}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Current password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={updatingPass}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
          >
            {updatingPass ? 'Updating...' : 'Update Entry Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
