import React, { useState } from 'react';
import { smartFetch } from '../../../../services/api';
import QuickAddAccountForm from './QuickAddAccountForm';

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

        <QuickAddAccountForm
          subForm={subForm}
          setSubForm={setSubForm}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
