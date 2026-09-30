import React from 'react';

export default React.memo(function SupplierSearchSection({
  supplierSelectRef,
  selectedSupplierObj,
  supplierSearch,
  setSupplierSearch,
  isSupplierOpen,
  setIsSupplierOpen,
  suppliers = [],
  supplierId,
  setSupplierId,
  setIsAddSupplierOpen,
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">
        Supplier *
      </label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1" ref={supplierSelectRef}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="Select Supplier (Search name / phone)"
            value={
              selectedSupplierObj
                ? `${selectedSupplierObj.name}${
                    selectedSupplierObj.phone ? ` (${selectedSupplierObj.phone})` : ''
                  }`
                : supplierSearch
            }
            onFocus={() => setIsSupplierOpen(true)}
            onChange={(e) => {
              setSupplierSearch(e.target.value);
              setIsSupplierOpen(true);
            }}
            className="w-full py-2.5 pl-10 !pl-10 pr-9 rounded-lg border-[1.5px] border-slate-300 text-sm text-slate-900 bg-white box-border focus:outline-none focus:border-emerald-500"
            style={{ paddingLeft: '2.5rem' }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <span className="text-xs">⇅</span>
          </div>
          {isSupplierOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl max-h-[230px] overflow-y-auto">
              {suppliers
                .filter((s) => {
                  const q = supplierSearch.trim().toLowerCase();
                  return (
                    !q ||
                    (s.name || '').toLowerCase().includes(q) ||
                    (s.phone || '').toLowerCase().includes(q)
                  );
                })
                .map((s) => {
                  const pay = Number(s.payable_balance || 0);
                  const wal = Number(
                    s.wallet_balance !== undefined
                      ? s.wallet_balance
                      : pay < 0
                      ? Math.abs(pay)
                      : 0
                  );
                  const dueTag =
                    pay > 0 ? `Dues: ৳${pay.toLocaleString()}` : '✓ No Dues';
                  const walTag = wal > 0 ? ` · Wallet: ৳${wal.toLocaleString()}` : '';
                  return (
                    <div
                      key={s.id}
                      onMouseDown={() => {
                        setSupplierId(String(s.id));
                        setSupplierSearch('');
                        setIsSupplierOpen(false);
                      }}
                      className={`p-2.5 px-3 cursor-pointer border-b border-slate-100 text-sm text-slate-900 hover:bg-emerald-50 transition-colors ${
                        String(s.id) === String(supplierId) ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      {s.name} ({dueTag}
                      {walTag})
                    </div>
                  );
                })}
              {suppliers.filter((s) => {
                const q = supplierSearch.trim().toLowerCase();
                return (
                  !q ||
                  (s.name || '').toLowerCase().includes(q) ||
                  (s.phone || '').toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div className="p-2.5 px-3 text-slate-400 text-xs">
                  No matching supplier
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline '+' Button: Triggers popup instead of redirecting */}
        <button
          type="button"
          onClick={() => setIsAddSupplierOpen(true)}
          className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-slate-300 bg-slate-50 text-sky-600 text-xl font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
          title="Quick Add Supplier (Popup)"
        >
          +
        </button>
      </div>
    </div>
  );
});
