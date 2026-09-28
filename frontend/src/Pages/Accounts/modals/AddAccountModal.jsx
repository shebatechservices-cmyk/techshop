import React, { useState, useEffect, useMemo } from 'react';
import API, { smartFetch } from '../../../services/api';

const getAuthToken = () => {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('sheba_token') ||
      localStorage.getItem('sheba_auth_token') ||
      sessionStorage.getItem('sheba_auth_token') ||
      ''
    );
  } catch {
    return '';
  }
};

export default function AddAccountModal({ isOpen, onClose, onSuccess }) {
  const [tenders, setTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sub-modal state for Quick Add Account (+ button)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [submittingSubModal, setSubmittingSubModal] = useState(false);
  const [subForm, setSubForm] = useState({
    methodType: 'drawer',
    accountName: '',
    accountNumber: '',
    openingBalance: '',
  });

  // Floating Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Main Form State
  const [form, setForm] = useState({
    tenderId: '',
    accountName: '',
    location: '',
    openingBalance: '',
    referenceId: '',
  });

  // Active User Info
  const activeUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.role_title || 'Super Admin';
      }
    } catch {
      // fallback
    }
    return 'Super Admin';
  }, []);

  // Fetch Payment Methods / Tenders
  const fetchTenders = async () => {
    try {
      setLoadingTenders(true);
      const token = getAuthToken();
      const res = await smartFetch('/accounts/tenders', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setTenders(list);
        return list;
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
    } finally {
      setLoadingTenders(false);
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setForm({
        tenderId: '',
        accountName: '',
        location: '',
        openingBalance: '',
        referenceId: '',
      });
      fetchTenders().then((list) => {
        if (list && list.length > 0) {
          setForm((prev) => ({ ...prev, tenderId: String(list[0].id) }));
        }
      });
    }
  }, [isOpen]);

  // Handle Quick Add Account (Sub-Modal Submission via POST /api/accounts)
  const handleSubModalSubmit = async (e) => {
    e.preventDefault();
    if (!subForm.accountName.trim()) {
      showToast('Account Name is required.', 'error');
      return;
    }

    try {
      setSubmittingSubModal(true);
      const token = getAuthToken();
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

      // Intercept 409 Conflict (Prisma P2002 / Duplicate Constraint)
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

      // Successful 201 Response: Real-time State Update
      const responseData = await res.json();
      const newAcc = responseData.data;

      showToast('Payment account created successfully!', 'success');
      setIsSubModalOpen(false);
      setSubForm({
        methodType: 'drawer',
        accountName: '',
        accountNumber: '',
        openingBalance: '',
      });

      // Reload tenders and update parent state in real-time
      const updatedList = await fetchTenders();
      if (newAcc && newAcc.id) {
        const matched = updatedList.find(
          (t) => String(t.id) === String(newAcc.tender_id || newAcc.id) || t.name.toLowerCase() === newAcc.name.toLowerCase()
        );
        if (matched) {
          setForm((prev) => ({
            ...prev,
            tenderId: String(matched.id),
            accountName: prev.accountName || newAcc.name,
          }));
        } else if (updatedList.length > 0) {
          setForm((prev) => ({
            ...prev,
            accountName: prev.accountName || newAcc.name,
          }));
        }
      }
    } catch (err) {
      console.error('Error in quick account creation:', err);
      showToast(err.message || 'An unexpected error occurred while creating the account.', 'error');
    } finally {
      setSubmittingSubModal(false);
    }
  };

  // Handle Main Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenderId) {
      setError('Please select a Payment Method first.');
      return;
    }
    if (!form.accountName.trim()) {
      setError('Please enter an Account Name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const tenderInt = parseInt(form.tenderId, 10);
      const payload = {
        tenderId: tenderInt,
        tender_id: tenderInt,
        accountName: form.accountName.trim(),
        name: form.accountName.trim(),
        location: form.location.trim(),
        openingBalance: parseFloat(form.openingBalance) || 0,
        referenceId: form.referenceId.trim(),
        createdBy: activeUser,
      };

      const token = getAuthToken();
      const res = await smartFetch('/accounts/account-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account record');
      }

      setSuccessMsg('Account created successfully!');
      showToast('Account created successfully!', 'success');
      if (onSuccess) {
        onSuccess(data.data);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Error creating account');
      showToast(err.message || 'Error creating account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification Container */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-[110000] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-xs font-semibold border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-600 border-rose-500 shadow-rose-900/30'
              : 'bg-emerald-600 border-emerald-500 shadow-emerald-900/30'
          }`}
        >
          <span className="text-base">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-2 text-white/80 hover:text-white font-bold text-sm bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Modal Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-4.5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl">
                🏦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white m-0 leading-tight">
                    New Account Create
                  </h2>
                  <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/25">
                    Ledger
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-xs text-slate-400">
                  Create cash drawer, bank branch, or MFS payment account
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-none flex items-center justify-center cursor-pointer transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="bg-transparent border-none text-rose-600 font-bold cursor-pointer hover:text-rose-800"
                >
                  ✕
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                <span>✅</span> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Step 1: Payment Method Selection with Quick-Action '+' Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    1. Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[0.72rem] text-slate-500">Select or add new</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    required
                    value={form.tenderId}
                    onChange={(e) => setForm({ ...form, tenderId: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Select Payment Method --</option>
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(true)}
                    title="Quick Add Payment Method / Account"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1 border-none cursor-pointer shrink-0"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Account Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Drawer, IFIC Aruail Branch, bKash Merchant"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Step 3: Location / Account Details */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Location / Account Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop Counter 1, 01711000000, Branch Code"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Step 4: Opening Balance & Reference ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Opening Balance (৳)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.openingBalance}
                      onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Ref / Trans. ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Haolad, Ref#101"
                    value={form.referenceId}
                    onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Footer Metadata */}
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[0.74rem] text-slate-600 flex items-center justify-between">
                <span>
                  📅 <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
                </span>
                <span>
                  👤 <strong>Created By:</strong> {activeUser}
                </span>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.tenderId}
                  className={`px-5 py-2 rounded-lg text-white text-xs font-bold border-none transition-all shadow-md ${
                    form.tenderId
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/25'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Creating...' : '+ Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Lightweight Sub-Modal for Quick Account & Method Creation */}
      {isSubModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10050]"
          onClick={() => setIsSubModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sub-modal Header */}
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
                onClick={() => setIsSubModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-none flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Sub-modal Form */}
            <form onSubmit={handleSubModalSubmit} className="p-5 flex flex-col gap-3.5">
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
                  <option value="mobile_banking">📱 Mobile Banking (bKash / Nagad / Rocket)</option>
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
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sub-modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSubModal || !subForm.accountName.trim()}
                  className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold border-none transition-all shadow-md ${
                    subForm.accountName.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/25'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submittingSubModal ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
