import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import A4ExecutivePrint from '../components/A4ExecutivePrint';
import PosThermalPrint from '../components/PosThermalPrint';
import LandscapeAuditPrint from '../components/LandscapeAuditPrint';

export default function ReportPrintModal({
  isOpen,
  onClose,
  analyticsData,
  auditData,
  periodLabel = '',
  filterDates = { from: '', to: '' },
}) {
  const [layout, setLayout] = useState('a4_executive'); // 'a4_executive' | 'pos_thermal' | 'landscape_audit'
  const [shop, setShop] = useState({
    shop_name: 'Seba Technology & Networking',
    shop_title: 'Professional CCTV & Network Solution',
    phone: '01800000000',
    address: 'Aruail South Market, Sarail',
  });

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) {
            setShop((prev) => ({
              ...prev,
              ...json.data,
            }));
          }
        })
        .catch((err) => console.error('Failed to load shop settings for print:', err));
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
    hour12: true,
  });

  const getModalMaxWidth = () => {
    switch (layout) {
      case 'pos_thermal':
        return 'max-w-xl';
      case 'landscape_audit':
        return 'max-w-6xl';
      default:
        return 'max-w-4xl';
    }
  };

  const getSheetMaxWidth = () => {
    switch (layout) {
      case 'pos_thermal':
        return 'w-[320px] max-w-[320px] p-4 font-mono';
      case 'landscape_audit':
        return 'w-full max-w-[1060px] p-8';
      default:
        return 'w-full max-w-[820px] p-8';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn"
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
          ${
            layout === 'pos_thermal'
              ? `
            @page {
              size: 80mm auto;
              margin: 3mm 4mm;
            }
          `
              : layout === 'landscape_audit'
              ? `
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
          `
              : `
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
          `
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        className={`bg-white rounded-2xl w-full ${getModalMaxWidth()} max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300 transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP TOOLBAR - NO PRINT */}
        <div className="no-print px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Standard Financial Print Center
              </h3>
              <p className="text-[11px] text-slate-400">
                Select layout • Real-time paper preview • Instant print or save as PDF
              </p>
            </div>
          </div>

          {/* LAYOUT SELECTOR TABS */}
          <div className="flex bg-slate-800 p-1 rounded-lg gap-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setLayout('a4_executive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                layout === 'a4_executive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📄 A4 Executive
            </button>
            <button
              type="button"
              onClick={() => setLayout('pos_thermal')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                layout === 'pos_thermal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🧾 80mm POS Slip
            </button>
            <button
              type="button"
              onClick={() => setLayout('landscape_audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                layout === 'landscape_audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📑 Landscape Audit
            </button>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition cursor-pointer"
            >
              <span>🖨️</span> Print Document
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold text-xs transition cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="print-preview-container">
          <div
            id="report-print-sheet"
            className={`bg-white shadow-md rounded-lg ${getSheetMaxWidth()} box-border`}
          >
            {layout === 'a4_executive' && (
              <A4ExecutivePrint
                shop={shop}
                pnl={pnl}
                inventory={inventory}
                ledgers={ledgers}
                topProducts={topProducts}
                printDateStr={printDateStr}
                periodLabel={periodLabel}
                filterDates={filterDates}
              />
            )}

            {layout === 'pos_thermal' && (
              <PosThermalPrint
                shop={shop}
                pnl={pnl}
                channels={channels}
                ledgers={ledgers}
                inventory={inventory}
                printDateStr={printDateStr}
                periodLabel={periodLabel}
                filterDates={filterDates}
              />
            )}

            {layout === 'landscape_audit' && (
              <LandscapeAuditPrint
                shop={shop}
                pnl={pnl}
                auditList={auditList}
                printDateStr={printDateStr}
                periodLabel={periodLabel}
                filterDates={filterDates}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
