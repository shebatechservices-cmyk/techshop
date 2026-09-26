import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import API from '../../../services/api';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';
import { isValidBDPhone } from '../../../utils/phoneUtils';

export default function AddCustomerModal({ isOpen, onClose, onCustomerCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState('Regular');
  const [receivableBalance, setReceivableBalance] = useState('');
  const [openingWallet, setOpeningWallet] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!isValidBDPhone(phone)) {
      setError('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API}/sales/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          customer_type: customerType,
          receivable_balance: Number(receivableBalance) || 0,
          opening_wallet_balance: Number(openingWallet) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to register customer');
        return;
      }

      if (onCustomerCreated) {
        onCustomerCreated(data.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Server error while saving customer');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-gray-500">👤</span>
            <div>
              <h3 className="m-0 text-lg font-bold text-gray-900">Add New Customer</h3>
              <p className="m-0 text-xs text-gray-500 mt-0.5">
                Register customer for sales, POS, and quotations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* Customer Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tanvir Hasan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BangladeshiPhoneInput
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1X-XXXXXXXX"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="optional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Customer Type & Initial Balance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Customer Group
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Regular">👤 Regular</option>
                  <option value="Technician">🔧 Technician (5% Discount)</option>
                  <option value="Reseller">🏪 Reseller (Wholesale)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Opening Due Balance ৳
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={receivableBalance}
                  onChange={(e) => setReceivableBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Opening Wallet Balance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Opening Wallet Balance ৳
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={openingWallet}
                onChange={(e) => setOpeningWallet(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Address / Delivery Location
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Road 4, Dhanmondi, Dhaka"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

