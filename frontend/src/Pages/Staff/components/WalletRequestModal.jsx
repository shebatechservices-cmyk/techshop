import React, { useState } from 'react';

export default function WalletRequestModal({
  isOpen,
  onClose,
  walletBalance = 0,
  onSubmit,
}) {
  const [type, setType] = useState('withdraw'); // 'withdraw' | 'deposit'
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState('bKash');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (type === 'withdraw' && numAmount > walletBalance) {
      setError(`অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ব্যালেন্স ৳${walletBalance.toLocaleString('en-IN')}`);
      return;
    }

    if (type === 'deposit' && !referenceId.trim()) {
      setError('ডিপোজিট বা টাকা জমার ক্ষেত্রে ট্রানজেকশন আইডি (TrxID) বা রেফারেন্স নম্বর দেওয়া বাধ্যতামূলক');
      return;
    }

    try {
      setSubmitting(true);
      const res = await onSubmit({
        type,
        amount: numAmount,
        channel,
        reference_id: referenceId.trim(),
        notes: notes.trim(),
      });
      if (res && res.success) {
        setAmount('');
        setReferenceId('');
        setNotes('');
        onClose();
      } else if (res && res.message) {
        setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setError('সার্ভার এরর হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const channelOptions = [
    { id: 'bKash', label: 'বিকাশ (bKash)', icon: '📱' },
    { id: 'Nagad', label: 'নগদ (Nagad)', icon: '📱' },
    { id: 'Rocket', label: 'রকেট (Rocket)', icon: '📱' },
    { id: 'Bank Transfer', label: 'ব্যাংক ট্রান্সফার (Bank Transfer)', icon: '🏦' },
    { id: 'Cash', label: 'শপ ক্যাশ / নগদ ক্যাশ (Cash Drawer)', icon: '💵' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
              {type === 'withdraw' ? '💸' : '📥'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {type === 'withdraw' ? 'উইথড্র রিকোয়েস্ট (টাকা উত্তোলন)' : 'ডিপোজিট রিকোয়েস্ট (টাকা জমা)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                ব্যালেন্স: <strong className="text-indigo-600">৳ {Number(walletBalance).toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl my-4">
          <button
            type="button"
            onClick={() => { setType('withdraw'); setError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'withdraw'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>💸 উইথড্র (টাকা নিব)</span>
          </button>
          <button
            type="button"
            onClick={() => { setType('deposit'); setError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'deposit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📥 ডিপোজিট (টাকা দিব)</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              টাকার পরিমাণ (৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ৳
              </span>
              <input
                type="number"
                min="10"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            {type === 'withdraw' && walletBalance > 0 && (
              <div className="flex gap-2 mt-1.5">
                {[500, 1000, 2000].filter(v => v <= walletBalance).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    ৳{v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(walletBalance)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                >
                  সব ব্যালেন্স (৳{walletBalance})
                </button>
              </div>
            )}
          </div>

          {/* Channel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              পেমেন্ট মাধ্যম / চ্যানেল *
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {channelOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference / TrxID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ট্রান্সফার / ট্রানজেকশন আইডি (TrxID) বা রেফারেন্স নম্বর {type === 'deposit' && '*'}
            </label>
            <input
              type="text"
              placeholder={type === 'deposit' ? 'যেমন: BK928374 বা রিসিট নং' : 'ঐচ্ছিক (বিকাশ/নগদ নম্বর বা অ্যাকাউন্ট নোট)'}
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মন্তব্য বা কাজের বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows="2"
              placeholder="যেমন: সাইট ভিজিট শেষ করে শপ ক্যাশে জমা দিলাম..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * রিকোয়েস্ট সাবমিট করার পর শপ অ্যাডমিন যাচাই করে আপনার ওয়ালেটে সরাসরি পোস্টিং বা পেমেন্ট সম্পন্ন করবেন।
          </p>

          {/* Submit CTA */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'withdraw'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>✓ সাবমিট করুন</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
