import React, { useState, useEffect, useMemo } from 'react';
import { smartFetch } from '../../../services/api';
import AccountCreateForm from './components/AccountCreateForm';
import QuickAddAccountSubModal from './components/QuickAddAccountSubModal';

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

  // Sub-modal toggle
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

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

  // Callback when a new account is created via QuickAddAccountSubModal
  const handleAccountCreated = async (newAcc) => {
    const updatedList = await fetchTenders();
    if (newAcc && newAcc.id) {
      const matched = updatedList.find(
        (t) =>
          String(t.id) === String(newAcc.tender_id || newAcc.id) ||
          t.name.toLowerCase() === newAcc.name.toLowerCase()
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

            <AccountCreateForm
              form={form}
              setForm={setForm}
              tenders={tenders}
              activeUser={activeUser}
              submitting={submitting}
              onCancel={onClose}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>

      {/* Sub-Modal */}
      <QuickAddAccountSubModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onAccountCreated={handleAccountCreated}
        showToast={showToast}
        getAuthToken={getAuthToken}
      />
    </>
  );
}

