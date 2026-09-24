import React from 'react';

export default function PartyActivityTab({
  profileData,
  balance,
  deleteError,
  deleteLoading,
  handleDeleteParty,
}) {
  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};
  const activityCount = profile.activity_count || 0;
  const transactions = profileData?.transactions || [];

  return (
    <div>
      <div
        className={`border rounded-xl p-4 mb-4 ${
          activityCount > 0 || Math.abs(balance) > 0
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        <h4
          className={`text-xs font-bold uppercase tracking-wider mb-1 ${
            activityCount > 0 || Math.abs(balance) > 0 ? 'text-amber-800' : 'text-emerald-800'
          }`}
        >
          {activityCount > 0 || Math.abs(balance) > 0 ? '⚠️ Account Audit Protection Active' : '✓ Safe for Deletion'}
        </h4>
        <p
          className={`text-xs leading-relaxed ${
            activityCount > 0 || Math.abs(balance) > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          {activityCount > 0 || Math.abs(balance) > 0
            ? `This party has ${activityCount} linked financial records and an active balance of ৳ ${balance.toLocaleString('en-BD')}. To preserve financial ledger audit integrity, deletion is disabled.`
            : 'This party has 0 linked sales, purchases, or ledger transactions. It can be safely removed.'}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Audit Checklist</h5>
        <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
          <li>Linked Sales / Purchase Orders: <strong className="text-slate-800">{stats.total_invoices || stats.total_pos || stats.total_sales || 0} records</strong></li>
          <li>Linked Quotations: <strong className="text-slate-800">{profileData?.quotations?.length || 0} records</strong></li>
          <li>Direct Ledger Transactions: <strong className="text-slate-800">{transactions.length} records</strong></li>
          <li>Current Ledger Balance: <strong className="text-slate-800">৳ {balance.toLocaleString('en-BD')}</strong></li>
        </ul>
      </div>

      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-3.5 text-xs font-medium">
          ⚠️ {deleteError}
        </div>
      )}

      {activityCount === 0 && Math.abs(balance) === 0 ? (
        <button
          type="button"
          onClick={handleDeleteParty}
          disabled={deleteLoading}
          className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          🗑️ {deleteLoading ? 'Deleting...' : 'Delete Party Permanently'}
        </button>
      ) : (
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span className="text-base">🔒</span>
          <span>Deletion locked due to existing activity. You can modify or deactivate this profile in the <strong>Edit Profile</strong> tab.</span>
        </div>
      )}
    </div>
  );
}
