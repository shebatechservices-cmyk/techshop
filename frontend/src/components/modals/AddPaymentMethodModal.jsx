import React from 'react';
import PaymentMethodForm from './payment-methods/PaymentMethodForm';
import PaymentMethodList from './payment-methods/PaymentMethodList';
import usePaymentMethodManager from './payment-methods/usePaymentMethodManager';

export default function AddPaymentMethodModal({ isOpen, onClose, onSuccess }) {
  const {
    methods,
    loading,
    submitting,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    editingMethod,
    setEditingMethod,
    handleSubmit,
    handleToggleActive,
    handleStartEdit,
    handleDeleteMethod,
  } = usePaymentMethodManager({ isOpen, onClose, onSuccess });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ position: 'relative', zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold shadow-xs">
              💳
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">Payment Methods</h3>
              <p className="text-xs text-slate-500 m-0">Create and configure payment channels</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1 transition cursor-pointer"
            title="Close Modal (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab switch inside modal */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('add');
              setEditingMethod(null);
            }}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'add'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ➕ Add New Method
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📋 Existing Methods</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {methods.length}
            </span>
          </button>
          {activeTab === 'edit' && editingMethod && (
            <button
              type="button"
              className="pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 border-amber-600 text-amber-700 flex items-center gap-1.5"
            >
              <span>✏️ Edit: {editingMethod.name || editingMethod.method_name}</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'add' || activeTab === 'edit' ? (
            <PaymentMethodForm
              formData={formData}
              setFormData={setFormData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              submitting={submitting}
              onClose={onClose}
              onSubmit={handleSubmit}
            />
          ) : (
            <PaymentMethodList
              methods={methods}
              loading={loading}
              onToggleActive={handleToggleActive}
              onStartEdit={handleStartEdit}
              onDeleteMethod={handleDeleteMethod}
              onAddNew={() => {
                setActiveTab('add');
                setEditingMethod(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
