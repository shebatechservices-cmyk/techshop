import React from 'react';
import AccountCreateForm from './components/AccountCreateForm';
import QuickAddAccountSubModal from './components/QuickAddAccountSubModal';
import { useAddAccountModal, getAuthToken } from './hooks/useAddAccountModal';

export default function AddAccountModal({ isOpen, onClose, onSuccess }) {
  const {
    tenders,
    submitting,
    error,
    setError,
    successMsg,
    isSubModalOpen,
    setIsSubModalOpen,
    toast,
    setToast,
    showToast,
    form,
    setForm,
    activeUser,
    handleAccountCreated,
    handleSubmit,
  } = useAddAccountModal({ isOpen, onClose, onSuccess });

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
