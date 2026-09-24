import React, { useState, useEffect } from 'react';
import API from '../../services/api';

export default function ReportPrintModal({ isOpen, onClose, analyticsData, auditData, periodLabel, filterDates }) {
  const [layout, setLayout] = useState('a4_executive'); // 'a4_executive' | 'pos_thermal' | 'landscape_audit'
  const [shop, setShop] = useState({
    shop_name: 'Seba Technology & Networking',
    shop_title: 'Professional CCTV & Network Solution',
    phone: '01800000000',
    address: 'Aruail South Market, Sarail'
  });

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`)
        .then(res => res.json())
        .then(json => {
          if (json && json.data) {
            setShop(prev => ({
              ...prev,
              ...json.data
            }));
          }
        })
        .catch(err => console.error('Failed to load shop settings for print:', err));
    }
  }, [isOpen]);

  if (!isOpen || !analyticsData) return null;

  const pnl = analyticsData.pnl || {};
  const inventory = analyticsData.inventory || {};
  const ledgers = analyticsData.ledgers || {};
  const channels = analyticsData.channels || [];
  const topProducts = analyticsData.top_products || [];
  const auditList = auditData || [];

  const handlePrint = () => {
    window.print();
  };

  const printDateStr = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      className="report-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      {/* Print Specific CSS Rules */}
      <style>{`
        @media screen {
          .print-preview-container {
            max-height: 80vh;
            overflow-y: auto;
            background: #e2e8f0;
            padding: 24px;
            display: flex;
            justify-content: center;
          }
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          #report-print-sheet, #report-print-sheet * {
            visibility: visible !important;
          }
          #report-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          ${layout === 'pos_thermal' ? `
            @page {
              size: 80mm auto;
              margin: 3mm 4mm;
            }
          ` : layout === 'landscape_audit' ? `
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
          ` : `
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
          `}
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: layout === 'pos_thermal' ? '560px' : layout === 'landscape_audit' ? '1180px' : '920px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          transition: 'max-width 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP TOOLBAR - NO PRINT */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🖨️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Standard Financial Print Center
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Select layout • Real-time paper preview • Instant print or save as PDF
              </p>
            </div>
          </div>

          {/* LAYOUT SELECTOR TABS */}
          <div style={{ display: 'flex', background: '#334155', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setLayout('a4_executive')}
              style={{
                background: layout === 'a4_executive' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📄 A4 Executive Statement
            </button>
            <button
              type="button"
              onClick={() => setLayout('pos_thermal')}
              style={{
                background: layout === 'pos_thermal' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🧾 80mm POS Thermal Slip
            </button>
            <button
              type="button"
              onClick={() => setLayout('landscape_audit')}
              style={{
                background: layout === 'landscape_audit' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📑 Landscape Audit Sheet
            </button>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '7px 16px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
              }}
            >
              🖨️ Print Document
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                background: '#475569',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="print-preview-container">
          <div
            id="report-print-sheet"
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: layout === 'pos_thermal' ? '4px' : '8px',
              width: layout === 'pos_thermal' ? '320px' : '100%',
              maxWidth: layout === 'pos_thermal' ? '320px' : layout === 'landscape_audit' ? '1060px' : '820px',
              padding: layout === 'pos_thermal' ? '16px 14px' : '32px 36px',
              fontFamily: layout === 'pos_thermal' ? 'monospace, Courier, sans-serif' : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#0f172a',
              boxSizing: 'border-box'
            }}
          >
            {/* =========================================================
                LAYOUT 1: A4 EXECUTIVE STATEMENT
               ========================================================= */}
            {layout === 'a4_executive' && (
              <div>
                {/* Official Letterhead */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                      {shop.shop_name || 'Seba Technology & Networking'}
                    </h1>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                      {shop.shop_title || 'Professional CCTV & Network Solution'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>
                      Official Financial Statement
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                      Generated: <strong>{printDateStr}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Period: <strong style={{ color: '#0f172a' }}>{periodLabel}</strong> ({filterDates.from} to {filterDates.to})
                    </div>
                  </div>
                </div>

                {/* Statement Title */}
                <div style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Statement of Comprehensive Income (Profit & Loss)
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Reporting Currency: Bangladeshi Taka (BDT ৳)
                  </span>
                </div>

                {/* Performance Summary Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '22px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gross Revenue</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                      ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                    </div>
                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>{pnl.total_invoices || 0} Invoices Billed</small>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cost of Goods (COGS)</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
                      ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
                    </div>
                    <small style={{ fontSize: '0.7rem', color: '#64748b' }}>Direct Product Cost</small>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>Gross Profit</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                      ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
                    </div>
                    <small style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>Margin: {pnl.gross_margin_pct || 0}%</small>
                  </div>

                  <div style={{ background: (pnl.net_profit || 0) >= 0 ? '#eff6ff' : '#fef2f2', border: (pnl.net_profit || 0) >= 0 ? '1px solid #bfdbfe' : '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.7rem', color: (pnl.net_profit || 0) >= 0 ? '#1e40af' : '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>Net Bottom-Line</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (pnl.net_profit || 0) >= 0 ? '#1d4ed8' : '#b91c1c', marginTop: '2px' }}>
                      ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
                    </div>
                    <small style={{ fontSize: '0.7rem', color: (pnl.net_profit || 0) >= 0 ? '#1e40af' : '#991b1b', fontWeight: 600 }}>Net Margin: {pnl.net_margin_pct || 0}%</small>
                  </div>
                </div>

                {/* Formal P&L Accounting Ledger Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, borderRadius: '4px 0 0 0' }}>Financial Particulars & Ledger Items</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, width: '140px' }}>Subtotal (৳)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, width: '150px', borderRadius: '0 4px 0 0' }}>Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>Gross Product Sales Revenue</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      <td style={{ padding: '6px 12px 6px 28px' }}>Less: Trade Discounts & Rebates Given</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', color: '#dc2626' }}>
                        - ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      <td style={{ padding: '6px 12px 6px 28px' }}>Add: Value Added Tax (VAT / Tax Collected)</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', color: '#15803d' }}>
                        + ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b' }}>Total Realized Sales Inflow</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                        ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>

                    {/* COGS */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#b91c1c' }}>
                        Less: Cost of Goods Sold (COGS)
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>
                        - ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      <td style={{ padding: '4px 12px 6px 28px', fontSize: '0.8rem' }}>
                        Direct inventory acquisition cost for {pnl.total_units_sold || 0} units delivered
                      </td>
                      <td style={{ padding: '4px 12px', textAlign: 'right', fontSize: '0.8rem' }}></td>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}></td>
                    </tr>

                    {/* GROSS PROFIT ROW */}
                    <tr style={{ borderBottom: '2px solid #0f172a', background: '#f0fdf4' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#166534', fontSize: '0.92rem' }}>
                        GROSS TRADING PROFIT (Gross Margin: {pnl.gross_margin_pct}%)
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}></td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                        ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>

                    {/* OPERATING EXPENSES */}
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#b45309' }}>
                        Less: Operating & Shop Expenses
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#b45309' }}>
                        - ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      <td style={{ padding: '4px 12px 6px 28px', fontSize: '0.8rem' }}>
                        Shop bills, maintenance, salaries, office supplies, utilities
                      </td>
                      <td style={{ padding: '4px 12px', textAlign: 'right', fontSize: '0.8rem' }}></td>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}></td>
                    </tr>

                    {/* NET PROFIT ROW */}
                    <tr style={{ borderBottom: '3px double #0f172a', background: (pnl.net_profit || 0) >= 0 ? '#eff6ff' : '#fef2f2' }}>
                      <td style={{ padding: '12px 12px', fontWeight: 900, color: (pnl.net_profit || 0) >= 0 ? '#1e3a8a' : '#991b1b', fontSize: '1rem' }}>
                        NET OPERATING PROFIT / (NET LOSS)
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>
                        Net Margin: {pnl.net_margin_pct}%
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: (pnl.net_profit || 0) >= 0 ? '#1d4ed8' : '#b91c1c', fontSize: '1.15rem' }}>
                        ৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Two-Column Financial Position Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                  {/* Inventory & Working Capital Valuation */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      📦 Current Inventory Asset Valuation
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Active Stock SKUs:</span>
                        <strong>{inventory.total_skus || 0} products ({inventory.total_stock_units || 0} total units)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Total Stock Cost Valuation:</span>
                        <strong style={{ color: '#2563eb' }}>৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Expected Retail Value:</span>
                        <strong style={{ color: '#0f172a' }}>৳ {inventory.total_retail_value?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                        <span style={{ color: '#166534', fontWeight: 600 }}>Unrealized Store Profit:</span>
                        <strong style={{ color: '#166534' }}>৳ {inventory.potential_profit?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow & Ledger Balances */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', background: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      👥 Working Capital & Party Balances
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Customer Receivables (Market Due):</span>
                        <strong style={{ color: '#dc2626' }}>৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Supplier Payables (Vendor Due):</span>
                        <strong style={{ color: '#ea580c' }}>৳ {ledgers.total_supplier_payables?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Cash In Drawers (Physical):</span>
                        <strong style={{ color: '#0d9488' }}>৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>Total Liquid Funds (All Accounts):</span>
                        <strong style={{ color: '#0f172a' }}>৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 5 Revenue Generating Products */}
                {topProducts.length > 0 && (
                  <div style={{ marginBottom: '28px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                      🏆 Top Revenue Generating Products (In Selected Period)
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Product / SKU</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Units Sold</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Revenue (৳)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Estimated COGS (৳)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Gross Profit (৳)</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.slice(0, 5).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>
                              {item.product_name} <span style={{ color: '#64748b', fontWeight: 400 }}>({item.sku})</span>
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>{item.units_sold}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {item.revenue_generated?.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#64748b' }}>৳ {Number(item.total_cost || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>৳ {item.profit?.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{item.margin_pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Audit Signatures */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <div style={{ textAlign: 'center', width: '180px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Prepared By
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Accountant / Officer</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '180px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Verified By
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Internal Auditor</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '180px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Approved By
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Managing Director</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.7rem', color: '#94a3b8' }}>
                  * This statement is an officially generated computer record from Sheba ERP/POS financial engine.
                </div>
              </div>
            )}

            {/* =========================================================
                LAYOUT 2: 80MM POS THERMAL SLIP
               ========================================================= */}
            {layout === 'pos_thermal' && (
              <div style={{ fontSize: '11px', lineHeight: '1.35', color: '#000000' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {shop.shop_name || 'SEBA TECHNOLOGY'}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {shop.address || 'Aruail South Market, Sarail'}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    Tel: {shop.phone || '01800000000'}
                  </div>
                  <div style={{ margin: '6px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', fontWeight: 'bold', fontSize: '12px' }}>
                    PERIODIC FINANCIAL SUMMARY
                  </div>
                </div>

                {/* Period & Time info */}
                <div style={{ marginBottom: '8px', fontSize: '10px' }}>
                  <div>Period : {periodLabel}</div>
                  <div>Range  : {filterDates.from} to {filterDates.to}</div>
                  <div>Printed: {printDateStr}</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', marginBottom: '6px' }}></div>

                {/* Sales Section */}
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                  [ SALES & REVENUE ]
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Total Invoices</span>
                  <span>{pnl.total_invoices || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Total Units Sold</span>
                  <span>{pnl.total_units_sold || 0} pcs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Gross Sales</span>
                  <span style={{ fontWeight: 'bold' }}>৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>(-) Discounts</span>
                  <span>- ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>(+) Tax / VAT</span>
                  <span>+ ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontWeight: 'bold' }}>
                  <span>Net Collected</span>
                  <span>৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Sales Due Given</span>
                  <span>৳ {pnl.total_due_given?.toLocaleString('en-IN') || 0}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                {/* Profitability Section */}
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                  [ COST & PROFITABILITY ]
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Est. COGS (Cost)</span>
                  <span>- ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontWeight: 'bold' }}>
                  <span>GROSS PROFIT</span>
                  <span>৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '10px' }}>
                  <span>Gross Margin</span>
                  <span>{pnl.gross_margin_pct || 0}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Operating Exp.</span>
                  <span>- ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontWeight: 'bold', fontSize: '12px' }}>
                  <span>NET PROFIT</span>
                  <span>৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '10px' }}>
                  <span>Net Margin</span>
                  <span>{pnl.net_margin_pct || 0}%</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                {/* Channels */}
                {channels.length > 0 && (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                      [ INFLOW BY CHANNEL ]
                    </div>
                    {channels.map((ch, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '10px' }}>
                        <span>{ch.method} ({ch.count})</span>
                        <span>৳ {Number(ch.total_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
                  </>
                )}

                {/* Balances */}
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                  [ BALANCE SNAPSHOT ]
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Cash in Drawers</span>
                  <span style={{ fontWeight: 'bold' }}>৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Customer Due</span>
                  <span>৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Stock Valuation</span>
                  <span>৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '14px 0 24px 0' }}></div>

                {/* Signatures */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <div style={{ borderTop: '1px dotted #000', width: '140px', margin: '0 auto', paddingTop: '4px', fontSize: '10px' }}>
                    Cashier / Manager
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '9px' }}>
                    *** Thank You ***
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                LAYOUT 3: LANDSCAPE DETAILED AUDIT SHEET
               ========================================================= */}
            {layout === 'landscape_audit' && (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 2px 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      {shop.shop_name || 'Seba Technology & Networking'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                      Sales Audit & Item Profit Register
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Period: <strong>{periodLabel}</strong> ({filterDates.from} to {filterDates.to}) &nbsp;|&nbsp; Generated: {printDateStr}
                    </div>
                  </div>
                </div>

                {/* Audit Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Invoice #</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date & Time</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (৳)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Discount</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Paid (৳)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Due (৳)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>COGS (৳)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Gross Profit</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Margin %</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Payment Method</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditList.length === 0 ? (
                      <tr>
                        <td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No sales transactions recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      auditList.map((row, idx) => {
                        const total = parseFloat(row.total_amount || 0);
                        const cogs = parseFloat(row.estimated_cogs || 0);
                        const profit = total - cogs;
                        const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;
                        const d = new Date(row.created_at);
                        const dateFormatted = isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr key={row.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ padding: '6px 8px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f172a' }}>{row.invoice_no}</td>
                            <td style={{ padding: '6px 8px', color: '#475569', whiteSpace: 'nowrap' }}>{dateFormatted}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <strong style={{ color: '#1e293b' }}>{row.customer_name}</strong>
                              {row.customer_phone && <span style={{ color: '#64748b', fontSize: '0.7rem' }}> ({row.customer_phone})</span>}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>৳ {total.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#dc2626' }}>৳ {parseFloat(row.discount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>৳ {parseFloat(row.paid_amount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: parseFloat(row.due_amount || 0) > 0 ? '#ea580c' : '#64748b' }}>৳ {parseFloat(row.due_amount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>৳ {cogs.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: profit >= 0 ? '#15803d' : '#dc2626' }}>৳ {profit.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{margin}%</td>
                            <td style={{ padding: '6px 8px', color: '#475569' }}>{row.payment_method || 'Cash'}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
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

                  {/* Summary Totals Row */}
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                      <td colSpan="4" style={{ padding: '8px 8px', textAlign: 'right' }}>
                        TOTAL SUMMARY ({auditList.length} Invoices):
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#0f172a' }}>
                        ৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#dc2626' }}>
                        ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#16a34a' }}>
                        ৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#ea580c' }}>
                        ৳ {pnl.total_due_given?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#b91c1c' }}>
                        ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right', color: '#15803d' }}>
                        ৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                        {pnl.gross_margin_pct}%
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Landscape Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Audited & Prepared By
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Authorizing Officer
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
