import React, { useState } from 'react';
import API from '../../../../services/api';

export default function StaffCustomerImport({
  isEdit,
  setFormData,
}) {
  const [searchPhone, setSearchPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [importedCustomer, setImportedCustomer] = useState(null);

  if (isEdit) return null;

  const handleSearchCustomer = async (e) => {
    if (e) e.preventDefault();
    const query = searchPhone.trim();
    if (!query) return;

    try {
      setSearchingCustomer(true);
      const res = await fetch(`${API}/sales/customers?phone=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCustomerResults(json.data || []);
        } else {
          setCustomerResults([]);
        }
      }
    } catch (err) {
      console.error('Error searching customer:', err);
    } finally {
      setSearchingCustomer(false);
      setSearched(true);
    }
  };

  const handleAutoFillCustomer = (cust) => {
    if (!cust) return;
    let p = cust.phone || '';
    if (p.startsWith('+880')) p = p.slice(4);
    else if (p.startsWith('880')) p = p.slice(3);
    else if (p.startsWith('0')) p = p.slice(1);

    setFormData((prev) => ({
      ...prev,
      name: cust.name || prev.name,
      phone: p || prev.phone,
      email: cust.email || prev.email,
      address: cust.address || prev.address,
    }));
    setImportedCustomer(cust);
    setCustomerResults([]);
    setSearched(false);
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>🔍</span> Import from Existing Customer
        </label>
        <span className="text-[11px] text-slate-400">Search by phone to auto-fill details</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter customer phone number..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchCustomer();
            }
          }}
          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 text-slate-800"
        />
        <button
          type="button"
          onClick={handleSearchCustomer}
          disabled={searchingCustomer || !searchPhone.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          {searchingCustomer ? 'Searching...' : 'Search Customer'}
        </button>
      </div>

      {searched && customerResults.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
          <p className="text-[11px] font-semibold text-slate-500">Matching Customers:</p>
          {customerResults.map((cust) => (
            <div
              key={cust.id}
              className="flex items-center justify-between p-2.5 bg-white border border-blue-200 rounded-xl"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                <p className="text-[11px] text-slate-500">
                  📞 {cust.phone} {cust.address ? `• 📍 ${cust.address}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAutoFillCustomer(cust)}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                ⚡ Auto-fill
              </button>
            </div>
          ))}
        </div>
      )}

      {searched && customerResults.length === 0 && (
        <p className="text-[11px] text-slate-400 text-center py-1">
          No customer found with &quot;{searchPhone}&quot;. You can manually fill the form below.
        </p>
      )}

      {importedCustomer && (
        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
          <span>
            ✓ Details auto-filled from customer: <strong>{importedCustomer.name}</strong> ({importedCustomer.phone})
          </span>
          <button
            type="button"
            onClick={() => setImportedCustomer(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
