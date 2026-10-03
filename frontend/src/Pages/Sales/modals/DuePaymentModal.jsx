import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function DuePaymentModal({
  isOpen,
  onClose,
  sale,
  customer,
  onPaymentSuccess,
}) {
  const [paymentMode, setPaymentMode] = useState('single'); // 'single' | 'bulk'
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saleDue = Number(sale?.due_amount || 0);
  const customerTotalDue = Number(
    customer?.receivable_balance ?? sale?.customer_receivable_balance ?? 0
  );
  const customerId = customer?.id || sale?.customer_id;
  const customerName = customer?.name || sale?.customer_name || 'Customer';

  // Fetch Payment Wallets/Accounts on modal open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setNote('');
      setReferenceNo('');
      setPaymentMode('single');
      setAmount(saleDue > 0 ? String(saleDue) : '');

      setLoadingAccounts(true);
      fetch(`${API}/accounts/wallets`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : json?.data || [];
          setAccounts(list);
          if (list.length > 0) {
            // Default to Cash Drawer if available, else first account
            const defaultAcc =
              list.find((a) => (a.account_type || '').toLowerCase() === 'drawer') ||
              list[0];
            setAccountId(String(defaultAcc.id));
          }
        })
        .catch((err) => {
          console.error('Failed to load accounts:', err);
          setError('Failed to load payment accounts list.');
        })
        .finally(() => setLoadingAccounts(false));
    }
  }, [isOpen, sale, saleDue]);

  // Update default amount when switching payment modes
  const handleModeChange = (mode) => {
    setPaymentMode(mode);
    setError('');
    if (mode === 'single') {
      setAmount(saleDue > 0 ? String(saleDue) : '');
    } else {
      setAmount(customerTotalDue > 0 ? String(customerTotalDue) : String(saleDue || ''));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (paymentMode === 'single' && numAmount > saleDue) {
      setError(`Amount cannot exceed invoice due (৳ ${saleDue.toLocaleString()}).`);
      return;
    }

    if (!accountId) {
      setError('Please select a payment wallet or account.');
      return;
    }

    try {
      setSubmitting(true);
      let url = '';
      let payload = {
        amount: numAmount,
        account_id: Number(accountId),
        note: note.trim() || undefined,
        reference_no: referenceNo.trim() || undefined,
      };

      if (paymentMode === 'single') {
        url = `${API}/sales/${sale?.id}/payments`;
      } else {
        if (!customerId) {
          throw new Error('Customer ID is required for bulk due settlement.');
        }
        url = `${API}/sales/customers/${customerId}/bulk-due-payment`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment transaction failed.');
      }

      // Notify other views
      window.dispatchEvent(new CustomEvent('data_changed'));

      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess(data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error collecting payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl font-bold">
              💳
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Collect Due Payment / বকেয়া আদায়
              </h3>
              <p className="text-xs text-slate-300">
                {paymentMode === 'single'
                  ? `Invoice #${sale?.invoice_no || sale?.id}`
                  : `Customer: ${customerName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Payment Mode Selector */}
        {customerId && customerTotalDue > saleDue && (
          <div className="px-5 pt-4 flex gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                paymentMode === 'single'
                  ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              📄 This Invoice Due ({taka(saleDue)})
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('bulk')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                paymentMode === 'bulk'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              👥 Customer Total Due ({taka(customerTotalDue)})
            </button>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Due Info Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {paymentMode === 'single' ? 'Current Invoice Due' : 'Customer Overall Due'}
              </span>
              <span className="text-xs text-slate-600">
                {customerName} {sale?.invoice_no ? `• ${sale.invoice_no}` : ''}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-rose-600">
                {taka(paymentMode === 'single' ? saleDue : customerTotalDue)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                Collected Amount (টাকার অংক) <span className="text-rose-500">*</span>
              </label>
              {paymentMode === 'single' && saleDue > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(String(saleDue))}
                    className="text-[10px] font-bold text-sky-600 hover:underline px-1.5 py-0.5 bg-sky-50 rounded border border-sky-200"
                  >
                    Full (100%)
                  </button>
                  {saleDue > 500 && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(Math.round(saleDue / 2)))}
                      className="text-[10px] font-bold text-slate-600 hover:underline px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                    >
                      Half (50%)
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ৳
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Payment Account Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Deposit Account / Wallet <span className="text-rose-500">*</span>
            </label>
            {loadingAccounts ? (
              <div className="text-xs text-slate-400 py-2">Loading accounts...</div>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Select Payment Wallet / Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_type || 'Account'}) — Balance: {taka(acc.balance || 0)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reference & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Ref / TrxID (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. TRX-98124"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Remarks / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cash settled by brother"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>💵</span>
                  <span>Confirm & Print Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
