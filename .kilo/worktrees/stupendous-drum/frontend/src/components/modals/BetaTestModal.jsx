import React, { useState, useEffect } from 'react';
import API_BASE from '../../services/api';
import ClearDataConfirmModal from './ClearDataConfirmModal';
import RestoreConfirmModal from './RestoreConfirmModal';

export default function BetaTestModal({ isOpen, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResults, setDiagResults] = useState([]);
  const [overallHealth, setOverallHealth] = useState(null);
  const [testSMSNumber, setTestSMSNumber] = useState('01700000000');
  const [smsStatus, setSmsStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Beta Test Checklist (stored in localStorage)
  const defaultChecklist = [
    { id: 'c1', module: 'POS & Sales', task: 'Create a cash sale invoice and verify PDF/thermal receipt preview', done: false },
    { id: 'c2', module: 'POS & Sales', task: 'Test customer lookup by mobile number and check loyalty points calculation', done: false },
    { id: 'c3', module: 'Inventory', task: 'Check stock valuation card, filter products by category and brand', done: false },
    { id: 'c4', module: 'Purchases', task: 'Create a purchase order with serial numbers and verify stock increase', done: false },
    { id: 'c5', module: 'Warranty', task: 'Instant serial number lookup (e.g. SN-HD-001) to view warranty expiry & supplier info', done: false },
    { id: 'c6', module: 'Warranty', task: 'Submit a new warranty claim and check status update flow', done: false },
    { id: 'c7', module: 'Projects', task: 'Assign technician to CCTV installation and test wallet commission payout', done: false },
    { id: 'c8', module: 'Accounts', task: 'Test cash drawer transfer, deposit, and view Day Close Summary', done: false },
    { id: 'c9', module: 'Expenses', task: 'Record a daily tea/conveyance expense and check category breakdown', done: false },
    { id: 'c10', module: 'Settings', task: 'Verify SMS gateway triggers toggle and receipt layout configuration', done: false },
    { id: 'c11', module: 'Settings', task: 'Trigger instant database backup and download .sql file', done: false },
    { id: 'c12', module: 'Security', task: 'Inspect SIEM audit logs and verify unauthorized access monitoring', done: false },
  ];

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_beta_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch (e) {
      return defaultChecklist;
    }
  });

  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_beta_feedbacks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [feedbackForm, setFeedbackForm] = useState({
    testerName: 'Tester-1',
    module: 'Sales',
    severity: 'Medium',
    comment: ''
  });
  const [feedbackSavedMsg, setFeedbackSavedMsg] = useState('');

  const handleToggleCheck = (id) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    try {
      localStorage.setItem('sheba_beta_checklist', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleResetChecklist = () => {
    if (window.confirm('Reset all beta test checklist items to uncompleted?')) {
      setChecklist(defaultChecklist);
      try {
        localStorage.removeItem('sheba_beta_checklist');
      } catch (e) {}
    }
  };

  const runDiagnostics = async () => {
    setIsRunningDiag(true);
    setOverallHealth('checking');

    const tests = [
      { name: 'Core API Gateway', endpoint: '/settings', check: res => res.success === true },
      { name: 'Shop Settings & Profile', endpoint: '/settings', check: res => res.success === true },
      { name: 'Product Catalog & Barcodes', endpoint: '/master/products', check: res => Array.isArray(res) },
      { name: 'Categories & Subcategories', endpoint: '/master/categories', check: res => Array.isArray(res) },
      { name: 'Suppliers & Vendors', endpoint: '/suppliers', check: res => res.success === true },
      { name: 'Sales & Invoicing Engine', endpoint: '/sales', check: res => res.success === true },
      { name: 'Purchase Orders & Stock-In', endpoint: '/purchase', check: res => Array.isArray(res) },
      { name: 'Inventory & Valuation', endpoint: '/inventory', check: res => res.success === true },
      { name: 'Customer & Supplier Ledgers', endpoint: '/parties', check: res => res.success === true },
      { name: 'Accounts & Day-Close', endpoint: '/accounts/day-close-summary', check: res => res.success === true },
      { name: 'Daily Expense Tracker', endpoint: '/expenses/overview', check: res => res.success === true },
      { name: 'Warranty & Serial Tracking', endpoint: '/warranty/claims', check: res => res.success === true },
      { name: 'Projects & Tech Wallets', endpoint: '/projects/invoices-lookup', check: res => res.success === true },
      { name: 'SMS Triggers & Backup Logs', endpoint: '/settings/sms/triggers', check: res => res.success === true },
      { name: 'Global Trash & Recovery', endpoint: '/trash/counts', check: res => res.success === true },
    ];

    const results = [];
    let passedCount = 0;

    for (const test of tests) {
      const startTime = performance.now();
      try {
        const resp = await fetch(`${API_BASE}${test.endpoint}`);
        const duration = Math.round(performance.now() - startTime);
        if (!resp.ok) {
          results.push({ name: test.name, endpoint: test.endpoint, ok: false, ms: duration, error: `HTTP ${resp.status}` });
        } else {
          const json = await resp.json();
          const passed = test.check(json);
          if (passed) {
            passedCount++;
            results.push({ name: test.name, endpoint: test.endpoint, ok: true, ms: duration });
          } else {
            results.push({ name: test.name, endpoint: test.endpoint, ok: false, ms: duration, error: 'Malformed Payload' });
          }
        }
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        results.push({ name: test.name, endpoint: test.endpoint, ok: false, ms: duration, error: err.message || 'Connection Failed' });
      }
    }

    setDiagResults(results);
    setIsRunningDiag(false);
    setOverallHealth(passedCount === tests.length ? '100% Operational' : `${passedCount}/${tests.length} Operational`);
  };

  useEffect(() => {
    if (isOpen && diagResults.length === 0) {
      runDiagnostics();
    }
  }, [isOpen]);

  const handleSendTestSMS = async () => {
    setSmsStatus('Sending test SMS...');
    try {
      const res = await fetch(`${API_BASE}/settings/sms/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testSMSNumber, message: 'Sheba Technology Beta Test Verification SMS. System is operational.' })
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus(`✓ SMS dispatched successfully!`);
      } else {
        setSmsStatus(`⚠ SMS notice: ${data.message}`);
      }
    } catch (e) {
      setSmsStatus(`✕ Error: ${e.message}`);
    }
  };

  const handleTriggerBackup = async () => {
    setBackupStatus('Creating database backup snapshot...');
    try {
      const res = await fetch(`${API_BASE}/settings/backup-trigger`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setBackupStatus(`✓ Backup created: ${data.backup?.backup_name}`);
      } else {
        setBackupStatus(`⚠ Backup notice: ${data.message}`);
      }
    } catch (e) {
      setBackupStatus(`✕ Backup error: ${e.message}`);
    }
  };

  const handleSaveFeedback = (e) => {
    e.preventDefault();
    if (!feedbackForm.comment.trim()) return;

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      testerName: feedbackForm.testerName,
      module: feedbackForm.module,
      severity: feedbackForm.severity,
      comment: feedbackForm.comment.trim()
    };

    const updated = [newEntry, ...feedbacks];
    setFeedbacks(updated);
    try {
      localStorage.setItem('sheba_beta_feedbacks', JSON.stringify(updated));
    } catch (e) {}

    setFeedbackForm({ ...feedbackForm, comment: '' });
    setFeedbackSavedMsg('✓ Test observation logged successfully!');
    setTimeout(() => setFeedbackSavedMsg(''), 3000);
  };

  const handleCopyDiagnostics = () => {
    const summary = [
      `=== SHEBA TECHNOLOGY ERP BETA DIAGNOSTICS REPORT ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `API Gateway: ${API_BASE}`,
      `Client Host: ${window.location.origin}`,
      `Overall Health: ${overallHealth || 'N/A'}`,
      `Completed Checklist Tasks: ${checklist.filter(c => c.done).length}/${checklist.length}`,
      `\nEndpoint Checks:`,
      ...diagResults.map(r => `[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} (${r.endpoint}) - ${r.ms}ms ${r.error ? `Error: ${r.error}` : ''}`),
      `\nLogged Observations: ${feedbacks.length} notes recorded.`
    ].join('\n');

    navigator.clipboard?.writeText(summary);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  if (!isOpen) return null;

  const completedCount = checklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        borderRadius: '16px',
        border: '1px solid #38bdf8',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
            }}>
              🧪
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  Sheba ERP Beta Test Suite & Diagnostics
                </h3>
                <span style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  v2.8.4 BETA
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                Host: <strong style={{ color: '#38bdf8' }}>{window.location.host}</strong> | API Gateway: <strong style={{ color: '#4ade80' }}>{API_BASE}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyDiagnostics}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: copySuccess ? '#4ade80' : '#cbd5e1',
                border: '1px solid #475569',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{copySuccess ? '✓ Copied' : '📋 Copy Report'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation & Status Pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 20px',
          background: '#131e32',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              style={{
                background: activeTab === 'diagnostics' ? '#0284c7' : 'transparent',
                color: activeTab === 'diagnostics' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔍 Live Diagnostics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              style={{
                background: activeTab === 'checklist' ? '#0284c7' : 'transparent',
                color: activeTab === 'checklist' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>✅ Test Checklist</span>
              <span style={{
                background: completedCount === checklist.length ? '#10b981' : '#475569',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.68rem'
              }}>
                {completedCount}/{checklist.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              style={{
                background: activeTab === 'feedback' ? '#0284c7' : 'transparent',
                color: activeTab === 'feedback' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📝 Test Observations</span>
              <span style={{
                background: '#475569',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.68rem'
              }}>
                {feedbacks.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              style={{
                background: activeTab === 'tools' ? '#0284c7' : 'transparent',
                color: activeTab === 'tools' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⚡ Quick Actions
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>System Status:</span>
            <span style={{
              background: overallHealth === '100% Operational' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: overallHealth === '100% Operational' ? '#34d399' : '#fbbf24',
              border: `1px solid ${overallHealth === '100% Operational' ? '#10b981' : '#f59e0b'}`,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: overallHealth === '100% Operational' ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 8px ${overallHealth === '100% Operational' ? '#10b981' : '#f59e0b'}`
              }}></span>
              {isRunningDiag ? 'Running Test...' : overallHealth || 'Ready'}
            </span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* TAB 1: LIVE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                    14-Point Automated System Diagnostics
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Runs non-destructive health checks against PostgreSQL endpoints to ensure 100% uptime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={isRunningDiag}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isRunningDiag ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>{isRunningDiag ? '⏳ Testing...' : '▶ Re-run Diagnostics'}</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '10px'
              }}>
                {diagResults.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#1e293b',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      border: `1px solid ${item.ok ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.4)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        marginTop: '2px'
                      }}>
                        {item.endpoint}
                      </div>
                      {item.error && (
                        <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '2px' }}>
                          ⚠ {item.error}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: item.ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: item.ok ? '#34d399' : '#f87171',
                        border: `1px solid ${item.ok ? '#10b981' : '#ef4444'}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-block'
                      }}>
                        {item.ok ? '🟢 ONLINE' : '🔴 ERROR'}
                      </span>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
                        {item.ms} ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TEST CHECKLIST */}
          {activeTab === 'checklist' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                    Beta Testing Verification Checklist
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Track functional testing progress across core business modules. Saved automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset Progress
                </button>
              </div>

              {/* Progress bar */}
              <div style={{
                background: '#1e293b',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Completion Rate:</span>
                  <span style={{ color: progressPercent === 100 ? '#34d399' : '#38bdf8' }}>
                    {progressPercent}% ({completedCount} of {checklist.length} verified)
                  </span>
                </div>
                <div style={{ background: '#0f172a', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: progressPercent === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheck(item.id)}
                    style={{
                      background: item.done ? 'rgba(16, 185, 129, 0.08)' : '#1e293b',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      border: `1px solid ${item.done ? 'rgba(16, 185, 129, 0.3)' : '#334155'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#10b981',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#334155',
                          color: '#38bdf8',
                          padding: '1px 7px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          {item.module}
                        </span>
                        <span style={{
                          fontSize: '0.84rem',
                          fontWeight: item.done ? 600 : 700,
                          color: item.done ? '#94a3b8' : '#f8fafc',
                          textDecoration: item.done ? 'line-through' : 'none'
                        }}>
                          {item.task}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FEEDBACK & OBSERVATIONS */}
          {activeTab === 'feedback' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                  Beta Tester Notes & Observations
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Log user experience feedback, edge cases, or bugs found during beta testing.
                </p>
              </div>

              <form onSubmit={handleSaveFeedback} style={{
                background: '#1e293b',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Tester Name
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.testerName}
                      onChange={e => setFeedbackForm({ ...feedbackForm, testerName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Module Under Test
                    </label>
                    <select
                      value={feedbackForm.module}
                      onChange={e => setFeedbackForm({ ...feedbackForm, module: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem'
                      }}
                    >
                      <option value="Sales">POS / Sales</option>
                      <option value="Inventory">Inventory & Products</option>
                      <option value="Purchases">Purchases & Stock-In</option>
                      <option value="Warranty">Warranty & S/N Claims</option>
                      <option value="Projects">Projects & CCTV Techs</option>
                      <option value="Accounts">Accounts & Day Close</option>
                      <option value="Expenses">Expenses</option>
                      <option value="Ecommerce">E-Commerce</option>
                      <option value="Settings">Settings & SMS</option>
                      <option value="General UI">General Layout & Navigation</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Observation Severity
                    </label>
                    <select
                      value={feedbackForm.severity}
                      onChange={e => setFeedbackForm({ ...feedbackForm, severity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem'
                      }}
                    >
                      <option value="Low">Low / Polish Suggestion</option>
                      <option value="Medium">Medium / Functional Note</option>
                      <option value="High">High / Broken Flow</option>
                      <option value="Passed">Passed / Verified Working</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Observation / Description
                  </label>
                  <textarea
                    rows={2}
                    value={feedbackForm.comment}
                    onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    placeholder="e.g. Scanned barcode SN-HD-001 in warranty module, verified customer name and 24-month validity correctly displayed."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                    {feedbackSavedMsg}
                  </span>
                  <button
                    type="submit"
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 18px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ＋ Log Observation
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feedbacks.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    No observations logged yet. Add your test results above!
                  </div>
                ) : (
                  feedbacks.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#1e293b',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        border: '1px solid #334155'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: item.severity === 'Passed' ? '#10b981' : item.severity === 'High' ? '#ef4444' : '#f59e0b',
                            color: '#fff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 800
                          }}>
                            {item.severity}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                            [{item.module}] - {item.testerName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {item.date}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                        {item.comment}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QUICK TOOLS */}
          {activeTab === 'tools' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                  Quick System Actions & Hardware Triggers
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Test real hardware triggers, SMS gateway delivery, and automated database backups.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                <div style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>Test Live SMS Delivery</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Sends a test payload through configured SMS gateway.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={testSMSNumber}
                      onChange={e => setTestSMSNumber(e.target.value)}
                      placeholder="017XXXXXXXX"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.82rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendTestSMS}
                      style={{
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Send SMS
                    </button>
                  </div>
                  {smsStatus && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                      {smsStatus}
                    </div>
                  )}
                </div>

                <div style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💾</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>Instant Database Snapshot</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Creates an instant .sql database dump and records entry in backup audit trail.
                  </p>
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={handleTriggerBackup}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Trigger Instant Backup Now
                    </button>
                  </div>
                  {backupStatus && (
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                      {backupStatus}
                    </div>
                  )}
                </div>

                <div style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔄</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>Clear Cache & Hard Reload</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Clears session storage and invalidates cached API queries to test clean start state.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      border: '1px solid #475569',
                      padding: '7px 16px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Session & Refresh
                  </button>
                </div>

                <div style={{
                  background: '#1e293b',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🚀</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>Quick Module Jump</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Instantly jump to any module view to execute beta test cases.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: 'POS Sales', sec: 'sales', tab: 'pos' },
                      { label: 'Catalog', sec: 'products', tab: 'catalog' },
                      { label: 'Purchases', sec: 'purchases', tab: 'history' },
                      { label: 'Warranty', sec: 'warranty', tab: 'check' },
                      { label: 'Projects', sec: 'projects', tab: 'list' },
                      { label: 'Day Close', sec: 'accounts', tab: 'dayclose' },
                      { label: 'Settings', sec: 'settings', tab: 'general' }
                    ].map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (onNavigate) onNavigate(btn.sec, btn.tab);
                          onClose();
                        }}
                        style={{
                          background: '#0f172a',
                          color: '#38bdf8',
                          border: '1px solid #334155',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🚨</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fca5a5' }}>Reset / Clear Dummy Test Data</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#fca5a5' }}>
                    Wipe transactional test records (sales, purchases, expenses) with confirmation phrase protection.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🧹</span>
                    <span>Wipe Test Data Now</span>
                  </button>
                </div>

                <div style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid rgba(2, 132, 199, 0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌱</span>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#38bdf8' }}>Restore Demo Test Data</h5>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Populate sample sales invoices, purchases, and customer records for ERP feature testing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(true)}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🔄</span>
                    <span>Restore Demo Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#090d16',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Sheba Technology ERP • Ready for LAN / Staging / Production Beta Testing
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '6px 20px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Suite
          </button>
        </div>
      </div>

      {/* Clear Dummy / Test Data Confirmation Modal */}
      <ClearDataConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onSuccess={() => {
          if (onNavigate) onNavigate('settings', 'backup');
          onClose();
        }}
      />

      {/* Restore Demo Data Modal */}
      <RestoreConfirmModal
        isOpen={showRestoreModal}
        isDemoRestore={true}
        onClose={() => setShowRestoreModal(false)}
        onSuccess={() => {
          if (onNavigate) onNavigate('settings', 'backup');
          onClose();
        }}
      />
    </div>
  );
}
