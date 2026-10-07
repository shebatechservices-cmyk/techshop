import React, { useState } from 'react';
import { smartFetch } from '../../../../services/api';

export default function QuickAddAccountSubModal({
  isOpen,
  onClose,
  onAccountCreated,
  showToast,
  getAuthToken,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [subForm, setSubForm] = useState({
    methodType: 'drawer',
    accountName: '',
    accountNumber: '',
    openingBalance: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subForm.accountName.trim()) {
      showToast('Account Name is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken ? getAuthToken() : '';
      const payload = {
        methodType: subForm.methodType,
        account_type: subForm.methodType,
        accountName: subForm.accountName.trim(),
        name: subForm.accountName.trim(),
        account_number: subForm.accountNumber.trim(),
        balance: parseFloat(subForm.openingBalance) || 0,
      };

      const res = await smartFetch('/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        const conflictMsg =
          errData.message ||
          `An account with name "${subForm.accountName.trim()}" already exists for the selected payment method.`;
        showToast(conflictMsg, 'error');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to create payment account.', 'error');
        return;
      }

      const responseData = await res.json();
      const newAcc = responseData.data;

      showToast('Payment account created successfully!', 'success');
      setSubForm({
        methodType: 'drawer',
        accountName: '',
        accountNumber: '',
        openingBalance: '',
      });
      onClose();

      if (onAccountCreated) {
        await onAccountCreated(newAcc);
      }
    } catch (err) {
      console.error('Error in quick account creation:', err);
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10050]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-5 py-3.5 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">✨</span>
            <div>
              <h3 className="text-sm font-bold text-white m-0">Quick Add Payment Account</h3>
              <p className="text-[0.7rem] text-indigo-200 m-0">
                Define method type and unique account name
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-none flex items-center justify-center cursor-pointer transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Method Type <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={subForm.methodType}
              onChange={(e) => setSubForm({ ...subForm, methodType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="drawer">💵 Cash Drawer / Physical Cash</option>
              <option value="bank">🏛️ Bank Account</option>
              <option value="mobile_banking">📱 Mobile Banking</option>
              <option value="wallet">💼 Digital / Staff Wallet</option>
              <option value="other">💳 Other Payment Channel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Account Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Main Cash Drawer, City Bank Principal, bKash Agent"
              value={subForm.accountName}
              onChange={(e) => setSubForm({ ...subForm, accountName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-[0.7rem] text-slate-500 mt-1 block">
              Must be unique per selected method type.
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Account / Details Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 1502203920101, 01700000000"
              value={subForm.accountNumber}
              onChange={(e) => setSubForm({ ...subForm, accountNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Initial Balance (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                ৳
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={subForm.openingBalance}
                onChange={(e) => setSubForm({ ...subForm, openingBalance: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                style={{ paddingLeft: '2rem' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !subForm.accountName.trim()}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold border-none transition-all shadow-md ${
                subForm.accountName.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/25'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Saving...' : 'Save & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
