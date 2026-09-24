import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import ReportPrintModal from './ReportPrintModal';

export default function Reports() {
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'top_products' | 'inventory' | 'ledgers' | 'sales_audit'
  
  const [analytics, setAnalytics] = useState(null);
  const [auditList, setAuditList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Period label for headers & printouts
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today': return 'Today (আজকের)';
      case 'yesterday': return 'Yesterday (গতকালের)';
      case '7days': return 'Last 7 Days (বিগত ৭ দিন)';
      case '30days': return 'Last 30 Days (বিগত ৩০ দিন)';
      case 'this_month': return 'This Month (চলতি মাস)';
      case 'last_month': return 'Last Month (গত মাস)';
      case 'this_year': return 'This Year (চলতি বছর)';
      case 'all': return 'All Time (সর্বমোট)';
      case 'custom': return `Custom: ${customFrom || 'Start'} to ${customTo || 'End'}`;
      default: return period;
    }
  }, [period, customFrom, customTo]);

  // Fetch Financial Analytics & Audit Data
  const fetchData = async () => {
    try {
      setLoading(true);
      let queryParams = `period=${period}`;
      if (period === 'custom' && customFrom && customTo) {
        queryParams += `&from_date=${customFrom}&to_date=${customTo}`;
      }

      const [analyticsRes, auditRes] = await Promise.all([
        fetch(`${API}/reports/analytics?${queryParams}`).catch(() => null),
        fetch(`${API}/reports/sales-audit?${queryParams}&limit=200`).catch(() => null)
      ]);

      if (analyticsRes && analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        if (aJson.success) setAnalytics(aJson);
      }

      if (auditRes && auditRes.ok) {
        const audJson = await auditRes.json();
        if (audJson.success) setAuditList(audJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customFrom && customTo)) {
      fetchData();
    }
  }, [period, customFrom, customTo]);

  // Export Sales Audit to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const exportToCSV = () => {
    if (!auditList || auditList.length === 0) {
      alert('No audit data available to export.');
      return;
    }

    const headers = [
      'Invoice No',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Sales Person',
      'Total (BDT)',
      'Discount (BDT)',
      'VAT (BDT)',
      'Paid (BDT)',
      'Due (BDT)',
      'Estimated COGS (BDT)',
      'Estimated Gross Profit (BDT)',
      'Gross Margin (%)',
      'Payment Method',
      'Payment Status'
    ];

    const rows = auditList.map(row => {
      const total = parseFloat(row.total_amount || 0);
      const cogs = parseFloat(row.estimated_cogs || 0);
      const profit = total - cogs;
      const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;
      const dateStr = row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19) : '';

      return [
        `"${row.invoice_no || ''}"`,
        `"${dateStr}"`,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${row.customer_phone || ''}"`,
        `"${(row.sales_person || '').replace(/"/g, '""')}"`,
        total,
        parseFloat(row.discount || 0),
        parseFloat(row.vat || 0),
        parseFloat(row.paid_amount || 0),
        parseFloat(row.due_amount || 0),
        cogs,
        profit,
        margin,
        `"${(row.payment_method || 'Cash').replace(/"/g, '""')}"`,
        `"${row.payment_status || ''}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sales_Audit_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Audit List for table
  const filteredAudit = useMemo(() => {
    return auditList.filter(item => {
      const matchSearch =
        (item.invoice_no || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (item.customer_name || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (item.customer_phone || '').toLowerCase().includes(auditSearch.toLowerCase());
      
      const matchStatus =
        statusFilter === 'all' ? true : item.payment_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [auditList, auditSearch, statusFilter]);

  const pnl = analytics?.pnl || {};
  const inventory = analytics?.inventory || {};
  const ledgers = analytics?.ledgers || {};
  const channels = analytics?.channels || [];
  const topProducts = analytics?.top_products || [];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* =========================================================
          TOP ACTION & CONTROL BAR
         ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.7rem' }}>📈</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Reports & Financial Analytics
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Enterprise P&L, real-time Cost of Goods Sold (COGS), multi-layout thermal & A4 printouts, inventory valuation & ledgers
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🖨️</span>
            <span>Print Layouts & Statements ▾</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            style={{
              padding: '10px 16px',
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh analytics data"
            style={{
              padding: '10px 14px',
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* =========================================================
          PERIOD FILTER PILLS & CUSTOM RANGE
         ========================================================= */}
      <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '6px', textTransform: 'uppercase' }}>
              Period:
            </span>
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: '7days', label: '7 Days' },
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'this_year', label: 'This Year' },
              { key: 'all', label: 'All Time' },
              { key: 'custom', label: '📅 Custom Range' }
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: period === p.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: period === p.key ? '#eff6ff' : '#ffffff',
                  color: period === p.key ? '#1d4ed8' : '#475569',
                  fontWeight: period === p.key ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Active Scope: <strong style={{ color: '#0f172a' }}>{periodLabel}</strong>
          </div>
        </div>

        {/* Custom Date Range Selectors */}
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>To:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>
            <button
              type="button"
              onClick={fetchData}
              style={{
                padding: '6px 14px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Filter
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
          <p style={{ color: '#475569', fontWeight: 600, margin: 0 }}>Computing Enterprise Financial Statements & Auditing Data...</p>
          <small style={{ color: '#94a3b8' }}>Aggregating revenue, item costs, gross margins, and ledgers</small>
        </div>
      ) : (
        <>
          {/* =========================================================
              KEY FINANCIAL METRICS RIBBON (KPIs)
             ========================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Gross Revenue */}
            <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #16a34a' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gross Sales Revenue</span>
              <h3 style={{ fontSize: '1.65rem', margin: '4px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
                ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Invoices: <strong>{pnl.total_invoices || 0}</strong></span>
                <span>Collected: <strong>৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}</strong></span>
              </div>
            </div>

            {/* COGS */}
            <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #dc2626' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cost of Goods (COGS)</span>
              <h3 style={{ fontSize: '1.65rem', margin: '4px 0 0 0', color: '#dc2626', fontWeight: 800 }}>
                ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Units Sold: <strong>{pnl.total_units_sold || 0} pcs</strong></span>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>Direct Item Cost</span>
              </div>
            </div>

            {/* Gross Trading Profit */}
            <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gross Profit</span>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {pnl.gross_margin_pct || 0}% Margin
                </span>
              </div>
              <h3 style={{ fontSize: '1.65rem', margin: '4px 0 0 0', color: '#2563eb', fontWeight: 800 }}>
                ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
              </h3>
              <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                Revenue minus Inventory COGS
              </div>
            </div>

            {/* Net Operating Profit */}
            <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: (pnl.net_profit || 0) >= 0 ? '4px solid #059669' : '4px solid #b91c1c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Net Bottom-Line</span>
                <span style={{ background: (pnl.net_profit || 0) >= 0 ? '#d1fae5' : '#fee2e2', color: (pnl.net_profit || 0) >= 0 ? '#065f46' : '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {pnl.net_margin_pct || 0}% Net
                </span>
              </div>
              <h3 style={{ fontSize: '1.65rem', margin: '4px 0 0 0', color: (pnl.net_profit || 0) >= 0 ? '#059669' : '#b91c1c', fontWeight: 800 }}>
                ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Overheads: <strong>৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}</strong></span>
                <span style={{ fontWeight: 600 }}>Pure Net Gain</span>
              </div>
            </div>

            {/* Liquid Balance & Working Capital */}
            <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #0d9488' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Liquid Cash & Bank</span>
              <h3 style={{ fontSize: '1.65rem', margin: '4px 0 0 0', color: '#0d9488', fontWeight: 800 }}>
                ৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Drawers: <strong>৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}</strong></span>
                <span>Bank/MFS: <strong>৳ {ledgers.total_bank_mfs?.toLocaleString('en-IN') || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* =========================================================
              NAVIGATION TABS
             ========================================================= */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'pnl', label: '📊 Executive P&L Statement' },
              { id: 'top_products', label: `🏆 Top Performing Items (${topProducts.length})` },
              { id: 'inventory', label: `📦 Inventory Asset Valuation (${inventory.total_skus || 0})` },
              { id: 'ledgers', label: '👥 Party Receivables & Payables' },
              { id: 'sales_audit', label: `📑 Sales Audit Register (${auditList.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  background: activeTab === tab.id ? '#ffffff' : 'transparent',
                  color: activeTab === tab.id ? '#1d4ed8' : '#64748b',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '0.88rem',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* =========================================================
              TAB CONTENT 1: EXECUTIVE P&L STATEMENT
             ========================================================= */}
          {activeTab === 'pnl' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* Left Column: Formal Income Statement */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Statement of Comprehensive Income
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Period: {periodLabel}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>Gross Product Invoiced Revenue</span>
                    <strong style={{ color: '#0f172a' }}>৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 16px', color: '#dc2626', fontSize: '0.84rem' }}>
                    <span>(-) Trade Discounts & Allowances</span>
                    <span>- ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 16px', color: '#16a34a', fontSize: '0.84rem' }}>
                    <span>(+) Value Added Tax (VAT / Tax Collected)</span>
                    <span>+ ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', fontWeight: 700 }}>
                    <span style={{ color: '#1e293b' }}>Total Realized Sales Collection</span>
                    <span style={{ color: '#1e293b' }}>৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}</span>
                  </div>

                  {/* COGS direct reduction */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', color: '#b91c1c' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>(-) Direct Cost of Goods Sold (COGS)</span>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Direct acquisition costs for {pnl.total_units_sold || 0} units sold</div>
                    </div>
                    <strong style={{ fontWeight: 700 }}>- ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}</strong>
                  </div>

                  {/* Gross Profit Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>GROSS TRADING PROFIT</div>
                      <small style={{ color: '#15803d' }}>Gross Margin: {pnl.gross_margin_pct || 0}%</small>
                    </div>
                    <strong style={{ fontSize: '1.25rem', color: '#15803d', fontWeight: 800 }}>
                      ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
                    </strong>
                  </div>

                  {/* Overhead Expenses */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', color: '#b45309' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>(-) Operating Expenses & Store Overheads</span>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Withdrawals, shop rent, salaries, utilities</div>
                    </div>
                    <strong style={{ fontWeight: 700 }}>- ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}</strong>
                  </div>

                  {/* Net Profit Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: (pnl.net_profit || 0) >= 0 ? '#eff6ff' : '#fef2f2', border: (pnl.net_profit || 0) >= 0 ? '1px solid #bfdbfe' : '1px solid #fecaca', borderRadius: '10px', alignItems: 'center', marginTop: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 900, color: (pnl.net_profit || 0) >= 0 ? '#1e40af' : '#991b1b', fontSize: '1.05rem' }}>
                        NET OPERATING PROFIT / (LOSS)
                      </div>
                      <small style={{ color: (pnl.net_profit || 0) >= 0 ? '#1d4ed8' : '#b91c1c', fontWeight: 600 }}>
                        Net Margin: {pnl.net_margin_pct || 0}%
                      </small>
                    </div>
                    <strong style={{ fontSize: '1.45rem', color: (pnl.net_profit || 0) >= 0 ? '#1d4ed8' : '#b91c1c', fontWeight: 900 }}>
                      ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Channels Breakdown & Purchasing Overview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Channel breakdown */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    💳 Sales Inflow by Payment Channel
                  </h3>
                  {channels.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No payment channel data for this period.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {channels.map((ch, idx) => {
                        const totalSales = pnl.gross_revenue || 1;
                        const pct = Math.min(100, ((parseFloat(ch.total_amount || 0) / totalSales) * 100)).toFixed(1);
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                {ch.method} <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({ch.count} transactions)</span>
                              </span>
                              <strong style={{ color: '#0f172a' }}>৳ {parseFloat(ch.total_amount || 0).toLocaleString('en-IN')} ({pct}%)</strong>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Purchase Order Activity */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    🛒 Inventory Purchases (In This Period)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Total Purchase Orders:</span>
                      <strong>{analytics?.purchases?.total_pos || 0} orders</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Total Purchase Cost:</span>
                      <strong style={{ color: '#dc2626' }}>৳ {analytics?.purchases?.total_purchased?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Paid to Suppliers:</span>
                      <strong style={{ color: '#16a34a' }}>৳ {analytics?.purchases?.total_paid?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>Purchase Due Incurred:</span>
                      <strong style={{ color: '#ea580c' }}>৳ {analytics?.purchases?.total_due?.toLocaleString('en-IN') || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 2: TOP PERFORMING PRODUCTS
             ========================================================= */}
          {activeTab === 'top_products' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Best Selling Items Ranked by Units & Revenue
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Calculated with real-time acquisition cost and gross margin contribution
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Rank</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Product Name</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>SKU / Barcode</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>Units Sold</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Revenue (৳)</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Total Cost (৳)</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Gross Profit (৳)</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          No sales item records found for this period.
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: '#64748b' }}>#{idx + 1}</td>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{p.product_name}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                            <div>{p.sku}</div>
                            <small>{p.barcode}</small>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#475569' }}>{p.category_name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>
                            <span style={{ background: '#f1f5f9', padding: '3px 10px', borderRadius: '12px' }}>
                              {p.units_sold} pcs
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            ৳ {p.revenue_generated?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>
                            ৳ {Number(p.total_cost || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                            ৳ {p.profit?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#166534'
                            }}>
                              {p.margin_pct}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 3: INVENTORY ASSET VALUATION
             ========================================================= */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  📦 Inventory Capital & Valuation Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Total Active Product SKUs:</span>
                    <strong style={{ color: '#0f172a' }}>{inventory.total_skus || 0} products</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Total Stock Quantity in Warehouse:</span>
                    <strong style={{ color: '#0f172a' }}>{inventory.total_stock_units || 0} units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Total Stock Cost Valuation (Tied Capital):</span>
                    <strong style={{ color: '#2563eb', fontSize: '1.05rem' }}>৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Total Stock Retail Selling Value:</span>
                    <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>৳ {inventory.total_retail_value?.toLocaleString('en-IN') || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <span style={{ color: '#166534', fontWeight: 700 }}>Unrealized Store Profit in Stock:</span>
                    <strong style={{ color: '#166534', fontSize: '1.15rem' }}>৳ {inventory.potential_profit?.toLocaleString('en-IN') || 0}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  ⚠️ Inventory Stock Health Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div>
                      <strong style={{ color: '#92400e' }}>Low Stock Alert Items</strong>
                      <div style={{ fontSize: '0.78rem', color: '#b45309' }}>Stock is at or below minimum reorder limit</div>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e' }}>
                      {inventory.low_stock_skus || 0} SKUs
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div>
                      <strong style={{ color: '#991b1b' }}>Out of Stock (Zero Stock)</strong>
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>Items needing immediate supplier reorder</div>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                      {inventory.out_of_stock_skus || 0} SKUs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 4: PARTY RECEIVABLES & PAYABLES LEDGER
             ========================================================= */}
          {activeTab === 'ledgers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Market Receivables & Vendor Payables */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  👥 Party Due & Working Capital Position
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Customer Receivables (Market Due):</span>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Money owed to shop by customers</div>
                    </div>
                    <strong style={{ color: '#dc2626', fontSize: '1.1rem' }}>৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Supplier Payables (Vendor Due):</span>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Money owed by shop to product vendors</div>
                    </div>
                    <strong style={{ color: '#ea580c', fontSize: '1.1rem' }}>৳ {ledgers.total_supplier_payables?.toLocaleString('en-IN') || 0}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#1e293b', fontWeight: 700 }}>Net Party Market Position:</span>
                    <strong style={{ color: (ledgers.total_customer_receivables - ledgers.total_supplier_payables) >= 0 ? '#16a34a' : '#dc2626', fontSize: '1.15rem' }}>
                      ৳ {(ledgers.total_customer_receivables - ledgers.total_supplier_payables).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cash & Bank Accounts */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  🏦 Active Cash Drawers & Bank Wallets
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(ledgers.wallets || []).length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No payment accounts recorded.</p>
                  ) : (
                    (ledgers.wallets || []).map(w => (
                      <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{(w.name || '').toLowerCase().includes('cash') || (w.name || '').toLowerCase().includes('drawer') ? '💵' : '🏛️'}</span>
                          <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>{w.name}</strong>
                        </div>
                        <strong style={{ color: '#0d9488', fontSize: '0.95rem' }}>৳ {parseFloat(w.balance || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '4px' }}>
                    <span style={{ color: '#166534', fontWeight: 700 }}>Total Liquid Funds:</span>
                    <strong style={{ color: '#166534', fontSize: '1.15rem' }}>৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 5: SALES AUDIT REGISTER
             ========================================================= */}
          {activeTab === 'sales_audit' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              {/* Search & Filter bar */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                  <input
                    type="text"
                    placeholder="Search by Invoice #, Customer Name, or Phone..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '380px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem'
                    }}
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      onClick={() => setAuditSearch('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
                  {['all', 'paid', 'partial', 'due'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: statusFilter === st ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: statusFilter === st ? '#eff6ff' : '#ffffff',
                        color: statusFilter === st ? '#1d4ed8' : '#64748b',
                        fontSize: '0.75rem',
                        fontWeight: statusFilter === st ? 700 : 500,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Invoice #</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date & Time</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (৳)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Discount</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Paid (৳)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Due (৳)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>COGS (৳)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Gross Profit</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Margin %</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Payment Method</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.length === 0 ? (
                      <tr>
                        <td colSpan="13" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          No sales transactions match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAudit.map((row, idx) => {
                        const total = parseFloat(row.total_amount || 0);
                        const cogs = parseFloat(row.estimated_cogs || 0);
                        const profit = total - cogs;
                        const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;
                        const d = new Date(row.created_at);
                        const dateFormatted = isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr key={row.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{row.invoice_no}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{dateFormatted}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <strong style={{ color: '#1e293b' }}>{row.customer_name}</strong>
                              {row.customer_phone && <span style={{ color: '#64748b', fontSize: '0.72rem' }}> ({row.customer_phone})</span>}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              ৳ {total.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#dc2626' }}>
                              ৳ {parseFloat(row.discount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                              ৳ {parseFloat(row.paid_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: parseFloat(row.due_amount || 0) > 0 ? '#ea580c' : '#64748b' }}>
                              ৳ {parseFloat(row.due_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>
                              ৳ {cogs.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: profit >= 0 ? '#15803d' : '#dc2626' }}>
                              ৳ {profit.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                              {margin}%
                            </td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>
                              {row.payment_method || 'Cash'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: row.payment_status === 'paid' ? '#dcfce7' : row.payment_status === 'partial' ? '#fef3c7' : '#fee2e2',
                                color: row.payment_status === 'paid' ? '#166534' : row.payment_status === 'partial' ? '#92400e' : '#991b1b'
                              }}>
                                {row.payment_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          PRINT PREVIEW & MULTI-LAYOUT MODAL
         ========================================================= */}
      <ReportPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        analyticsData={analytics}
        auditData={auditList}
        periodLabel={periodLabel}
        filterDates={analytics?.filter || { from: customFrom || 'Start', to: customTo || 'Today' }}
      />
    </div>
  );
}
