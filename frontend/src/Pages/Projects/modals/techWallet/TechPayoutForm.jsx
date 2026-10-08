import React from 'react';

export default function TechPayoutForm({
  wallets = [],
  sourceAccounts = [],
  selectedTechName,
  setSelectedTechName,
  sourceAccountId,
  setSourceAccountId,
  payoutAmount,
  setPayoutAmount,
  payoutNote,
  setPayoutNote,
  submittingPayout,
  handlePayoutSubmit,
  setActiveTab,
}) {
  return (
    <div
      style={{
        maxWidth: '540px',
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <h4
        style={{
          margin: '0 0 14px',
          fontSize: '1.05rem',
          fontWeight: 800,
          color: '#0f172a',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
        }}
      >
        💵 Technician Payout (Disbursement)
      </h4>

      <form onSubmit={handlePayoutSubmit}>
        {/* Tech selection */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            Select Technician *
          </label>
          <select
            value={selectedTechName}
            onChange={(e) => {
              setSelectedTechName(e.target.value);
              const w = wallets.find((x) => x.tech_name === e.target.value);
              if (w && parseFloat(w.balance || 0) > 0) {
                setPayoutAmount(parseFloat(w.balance || 0));
              }
            }}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- Select Technician --</option>
            {wallets.map((w, i) => (
              <option key={i} value={w.tech_name}>
                {w.tech_name} (Wallet Balance: ৳{' '}
                {parseFloat(w.balance || 0).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            Payout Amount (৳) *
          </label>
          <input
            type="number"
            required
            placeholder="e.g. 2000"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#16a34a',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Source Payment Account */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            Source Payment Account (Debit From) *
          </label>
          <select
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              boxSizing: 'border-box',
            }}
          >
            {sourceAccounts.map((sa) => (
              <option key={sa.id} value={sa.id}>
                {sa.name} ({sa.account_type}) — Available Balance: ৳{' '}
                {parseFloat(sa.balance || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          <small
            style={{
              color: '#64748b',
              fontSize: '0.74rem',
              marginTop: '2px',
              display: 'block',
            }}
          >
            * Funds will be automatically deducted from the selected source
            account (e.g. Cash Drawer or Bank).
          </small>
        </div>

        {/* Note */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            Reference / Payment Note
          </label>
          <input
            type="text"
            placeholder="e.g. Compensation for CCTV installation & maintenance"
            value={payoutNote}
            onChange={(e) => setPayoutNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submittingPayout}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: submittingPayout ? '#94a3b8' : '#16a34a',
              color: '#fff',
              fontWeight: 700,
              cursor: submittingPayout ? 'not-allowed' : 'pointer',
            }}
          >
            {submittingPayout ? 'Processing Payout...' : '✓ Confirm Payout'}
          </button>
        </div>
      </form>
    </div>
  );
}
