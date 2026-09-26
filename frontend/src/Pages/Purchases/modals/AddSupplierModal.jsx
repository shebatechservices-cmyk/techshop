import React, { useState } from 'react';
import API from '../../../services/api';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';
import { isValidBDPhone } from '../../../utils/phoneUtils';

export default function AddSupplierModal({ isOpen, onClose, onSupplierCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    payable_balance: 0,
    opening_wallet_balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'payable_balance' || name === 'opening_wallet_balance' ? (Number(value) || 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    if (formData.phone && !isValidBDPhone(formData.phone)) {
      setError('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }
    if (formData.mobile && !isValidBDPhone(formData.mobile)) {
      setError('Please enter a valid 10-digit alternative mobile number after +880 (e.g. 18-XXXXXXXX).');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API}/purchase/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }

      const initialForm = {
        name: '',
        contact_person: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        payable_balance: 0,
        opening_wallet_balance: 0,
      };
      setFormData(initialForm);

      if (onSupplierCreated) {
        onSupplierCreated(data.data || data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10050] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="m-0 text-lg font-bold text-slate-900">
              Add New Supplier
            </h3>
            <p className="m-0 text-xs text-slate-500 mt-0.5">
              Create a new vendor profile for purchasing and payable tracking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Name */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Supplier / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Smart Technologies Ltd."
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Contact Person */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Phone */}
            <BangladeshiPhoneInput
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="1X-XXXXXXXX"
            />

            {/* Mobile */}
            <BangladeshiPhoneInput
              label="Alternative Mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="1X-XXXXXXXX"
            />

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. info@supplier.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Office / Store Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Computer City Center, Level 4, Dhaka"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Opening Payable Due */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Opening Payable Balance (৳)
              </label>
              <input
                type="number"
                name="payable_balance"
                value={formData.payable_balance}
                onChange={handleChange}
                min="0"
                step="any"
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">
                Initial amount you currently owe this supplier, if any.
              </span>
            </div>

            {/* Opening Wallet Balance */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">
                Opening Wallet Balance (৳)
              </label>
              <input
                type="number"
                name="opening_wallet_balance"
                value={formData.opening_wallet_balance}
                onChange={handleChange}
                min="0"
                step="any"
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500">
                Pre-funded wallet balance for this supplier, if any.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
