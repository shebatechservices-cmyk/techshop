import React, { useState } from 'react';
import API from '../../../../services/api';

export default function TechWalletRequestsTab({
  pendingRequests = [],
  sourceAccounts = [],
  loadPendingRequests = () => {},
  loadWalletData = () => {},
  onRefreshProjects = () => {},
}) {
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const handleRespond = async (requestId, action) => {
    const selectedAccountId = selectedAccounts[requestId] || (sourceAccounts[0]?.id || null);
    const adminNote = adminNotes[requestId] || '';

    if (action === 'approve' && !selectedAccountId) {
      alert('অনুগ্রহ করে পেমেন্ট বা পোস্টিং এর জন্য একটি ক্যাশ বা ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।');
      return;
    }

    const confirmMsg = action === 'approve'
      ? 'আপনি কি নিশ্চিত যে এই রিকোয়েস্টটি অনুমোদন এবং পোস্টিং করতে চান?'
      : 'আপনি কি নিশ্চিত যে এই রিকোয়েস্টটি বাতিল করতে চান?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(requestId);
      const res = await fetch(`${API}/staff/wallet-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          source_account_id: selectedAccountId ? Number(selectedAccountId) : null,
          admin_notes: adminNote,
          admin_name: 'Shop Admin',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'রিকোয়েস্ট সফলভাবে প্রসেস করা হয়েছে।');
        await loadPendingRequests();
        await loadWalletData();
        if (onRefreshProjects) onRefreshProjects();
      } else {
        alert(data.message || 'রিকোয়েস্ট প্রসেস করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার এরর হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🎉</span>
        <h4 style={{ margin: '0 0 4px', color: '#1e293b', fontWeight: 700, fontSize: '1rem' }}>
          কোনো পেন্ডিং উইথড্র বা ডিপোজিট রিকোয়েস্ট নেই
        </h4>
        <p style={{ margin: 0, fontSize: '0.82rem' }}>
          টেকনিশিয়ানদের সকল উইথড্র ও ডিপোজিট রিকোয়েস্ট সম্পন্ন এবং আপ-টু-ডেট রয়েছে।
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#eff6ff',
          padding: '10px 16px',
          borderRadius: '10px',
          border: '1px solid #bfdbfe',
        }}
      >
        <div style={{ fontSize: '0.84rem', color: '#1e40af', fontWeight: 600 }}>
          💡 টেকনিশিয়ান ওয়ালেটের পেন্ডিং রিকোয়েস্ট অনুমোদন দিলে তা স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট অ্যাকাউন্ট এবং ওয়ালেটে পোস্ট হয়ে যাবে।
        </div>
        <button
          type="button"
          onClick={loadPendingRequests}
          style={{
            padding: '4px 10px',
            background: '#ffffff',
            border: '1px solid #93c5fd',
            borderRadius: '6px',
            fontSize: '0.76rem',
            color: '#1d4ed8',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🔄 রিফ্রেশ
        </button>
      </div>

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '10px 14px', fontWeight: 700 }}>টেকনিশিয়ান</th>
              <th style={{ padding: '10px 14px', fontWeight: 700 }}>টাইপ ও পরিমাণ</th>
              <th style={{ padding: '10px 14px', fontWeight: 700 }}>চ্যানেল ও রেফারেন্স</th>
              <th style={{ padding: '10px 14px', fontWeight: 700 }}>পোস্টিং একাউন্ট ও নোট</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>পদক্ষেপ</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((req) => {
              const isWithdraw = req.type === 'withdraw';
              const isProcessing = processingId === req.id;
              const selectedAcc = selectedAccounts[req.id] || (sourceAccounts[0]?.id || '');
              const note = adminNotes[req.id] || '';

              return (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem' }}>
                      {req.technician_name}
                    </strong>
                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
                      {req.technician_phone || `ID: #${req.technician_id}`}
                    </span>
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                      ব্যালেন্স: ৳{parseFloat(req.current_balance || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: isWithdraw ? '#fee2e2' : '#dcfce7',
                        color: isWithdraw ? '#b91c1c' : '#15803d',
                        marginBottom: '4px',
                      }}
                    >
                      {isWithdraw ? '💸 WITHDRAW' : '📥 DEPOSIT'}
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isWithdraw ? '#dc2626' : '#16a34a' }}>
                      ৳ {parseFloat(req.amount || 0).toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#334155' }}>
                      {req.channel || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                      TrxID / Ref: <strong style={{ color: '#0f172a' }}>{req.reference_id || 'N/A'}</strong>
                    </div>
                    {req.notes && (
                      <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                        "{req.notes}"
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                      পোস্টিং একাউন্ট ({isWithdraw ? 'উইথড্র প্রদান' : 'জমা গ্রহণ'}):
                    </label>
                    <select
                      value={selectedAcc}
                      onChange={(e) => setSelectedAccounts({ ...selectedAccounts, [req.id]: e.target.value })}
                      disabled={isProcessing}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        marginBottom: '6px',
                      }}
                    >
                      {sourceAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (৳ {parseFloat(acc.balance || 0).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="অ্যাডমিন নোট / ট্রানজেকশন রিমার্কস..."
                      value={note}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                      disabled={isProcessing}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>

                  <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, 'approve')}
                        disabled={isProcessing}
                        style={{
                          padding: '6px 12px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ✓ অনুমোদন ও পোস্টিং
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, 'reject')}
                        disabled={isProcessing}
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.74rem',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ✕ বাতিল
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
