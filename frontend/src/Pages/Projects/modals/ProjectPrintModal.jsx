import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

export default function ProjectPrintModal({ isOpen, onClose, project }) {
  const [layout, setLayout] = useState('a4_jobcard'); // 'a4_jobcard' | 'pos_thermal'
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

  if (!isOpen || !project) return null;

  const setup = parseFloat(project.setup_charge || 0);
  const conv = parseFloat(project.conveyance_cost || 0);
  const meal = parseFloat(project.meal_allowance || 0);
  const totalTechPayout = setup + conv + meal > 0 ? (setup + conv + meal) : parseFloat(project.charges || 0);
  const customerBill = parseFloat(project.customer_billing_amount || 0);

  const equipmentList = Array.isArray(project.equipment_details)
    ? project.equipment_details
    : typeof project.equipment_details === 'string'
      ? JSON.parse(project.equipment_details || '[]')
      : [];

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
          .project-print-preview-container {
            max-height: 82vh;
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
          #project-print-sheet, #project-print-sheet * {
            visibility: visible !important;
          }
          #project-print-sheet {
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
          maxWidth: layout === 'pos_thermal' ? '540px' : '880px',
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
                প্রজেক্ট ও সার্ভিস প্রিন্ট সেন্টার
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                টেকনিশিয়ান জব কার্ড ও কাস্টমার ডেলিভারি স্লিপ প্রিন্ট করুন
              </p>
            </div>
          </div>

          {/* LAYOUT SWITCHER */}
          <div style={{ display: 'flex', background: '#334155', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setLayout('a4_jobcard')}
              style={{
                background: layout === 'a4_jobcard' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📄 A4 অফিশিয়াল জব কার্ড
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
                cursor: 'pointer'
              }}
            >
              🧾 80mm থার্মাল কাউন্টার স্লিপ
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
              🖨️ প্রিন্ট করুন
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
              ✕ বন্ধ করুন
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="project-print-preview-container">
          <div
            id="project-print-sheet"
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: layout === 'pos_thermal' ? '4px' : '8px',
              width: layout === 'pos_thermal' ? '320px' : '100%',
              maxWidth: layout === 'pos_thermal' ? '320px' : '780px',
              padding: layout === 'pos_thermal' ? '16px 14px' : '32px 36px',
              fontFamily: layout === 'pos_thermal' ? 'monospace, Courier, sans-serif' : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#0f172a',
              boxSizing: 'border-box'
            }}
          >
            {/* =========================================================
                LAYOUT 1: A4 OFFICIAL SERVICE JOB CARD
               ========================================================= */}
            {layout === 'a4_jobcard' && (
              <div>
                {/* Official Letterhead */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '18px' }}>
                  <div>
                    <h1 style={{ margin: '0 0 3px 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                      {shop.shop_name || 'Seba Technology & Networking'}
                    </h1>
                    <p style={{ margin: '0 0 3px 0', fontSize: '0.84rem', color: '#475569', fontWeight: 500 }}>
                      {shop.shop_title || 'Professional CCTV & Network Solution'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      📍 {shop.address || 'Aruail South Market, Sarail'} &nbsp;|&nbsp; 📞 {shop.phone || '01800000000'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-block', background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      TECHNICAL WORK ORDER & JOB CARD
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      Job Code: {project.project_code}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      তারিখ: {new Date(project.created_at || new Date()).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                {/* Scope & Source Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>কাজের শিরোনাম</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>{project.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: project.invoice_id ? '#eff6ff' : '#fef3c7',
                      color: project.invoice_id ? '#1e40af' : '#92400e',
                      border: project.invoice_id ? '1px solid #bfdbfe' : '1px solid #fde68a'
                    }}>
                      {project.invoice_id ? `📦 নতুন সেটাপ (ইনভয়েস: ${project.invoice_no})` : '🔧 পুরাতন রিপেয়ার ও সার্ভিস'}
                    </span>
                  </div>
                </div>

                {/* Two Column: Client/Site Info & Assigned Technician Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  {/* Client Info */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                      👤 কাস্টমার ও সাইট তথ্য
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                      <div>মালিকের নাম: <strong>{project.customer_name}</strong></div>
                      <div>মোবাইল: <strong style={{ color: '#16a34a' }}>{project.site_phone || project.customer_phone || 'N/A'}</strong></div>
                      <div>সাইটের ঠিকানা: <strong>{project.site_address || 'Not specified'}</strong></div>
                      <div>কাজের ধরণ: <strong>{project.project_type}</strong></div>
                    </div>
                  </div>

                  {/* Technician Info */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                      👷 টেকনিশিয়ান ও শিডিউল তথ্য
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                      <div>টেকনিশিয়ান: <strong>{project.technician_name}</strong></div>
                      <div>যোগাযোগ: <strong>{project.technician_contact || 'N/A'}</strong></div>
                      <div>শুরুর তারিখ: <strong>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : 'Immediate'}</strong></div>
                      <div>ইনচার্জ অনুমোদন: <strong style={{ color: project.admin_confirmed ? '#16a34a' : '#d97706' }}>{project.admin_confirmed ? `অনুমোদিত (${project.confirmed_by_name || 'Admin'})` : 'অপেক্ষমান'}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Equipment Checklist (If New Setup or specified) */}
                {equipmentList.length > 0 && (
                  <div style={{ marginBottom: '18px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                      📋 ইনস্টলেশন ইকুইপমেন্ট ও ডিভাইস তালিকা (Equipment Checklist)
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', width: '40px' }}>#</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>ডিভাইস / পার্টসের নাম</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', width: '80px' }}>পরিমাণ</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', width: '120px' }}>ইনস্টলেশন স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentList.map((eq, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 10px', color: '#64748b' }}>{i + 1}</td>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{eq.product_name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>{eq.quantity} টি</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>[ &nbsp; ] সম্পন্ন</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Job Description & Special Instructions */}
                {project.description && (
                  <div style={{ marginBottom: '18px', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>কাজের বিবরণ ও নির্দেশনা:</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#1e293b', whiteSpace: 'pre-line' }}>
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Financial Summary & Remuneration Table */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                    💰 পারিশ্রমিক ও সার্ভিস বিল হিসাব (Financial Terms)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Technician Payout breakdown */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr style={{ background: '#eff6ff', color: '#1e40af' }}>
                          <th colSpan="2" style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>টেকনিশিয়ান পারিশ্রমিক ব্রেকডাউন</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px' }}>সেটাপ চার্জ (Setup Fee)</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {setup.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px' }}>যাতায়াত খরচ (Conveyance)</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {conv.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px' }}>মিলের হিসাব (Meal Allowance)</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {meal.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                          <td style={{ padding: '6px 10px', color: '#1e3a8a' }}>মোট টেকনিশিয়ান প্রাপ্য (ওয়ালেট)</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: '#1d4ed8' }}>৳ {totalTechPayout.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Customer Bill */}
                    <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>কাস্টমার সার্ভিস বিল</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>
                        ৳ {customerBill.toLocaleString('en-IN')}
                      </div>
                      <small style={{ fontSize: '0.72rem', color: '#166534' }}>
                        * কাজ সফলভাবে সম্পন্ন হওয়ার পর এই বিল কাস্টমার থেকে দোকান গ্রহণ করবে।
                      </small>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <div style={{ textAlign: 'center', width: '170px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      কাস্টমার স্বাক্ষর
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>কাজ বুঝে পেয়েছি ও সন্তুষ্ট</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '170px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      টেকনিশিয়ান স্বাক্ষর
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{project.technician_name}</span>
                  </div>
                  <div style={{ textAlign: 'center', width: '170px' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                      সেটাপ ইনচার্জ / এডমিন
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>অনুমোদিত কর্মাদেশ</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.68rem', color: '#94a3b8' }}>
                  প্রিন্ট সময়: {printDateStr} &nbsp;|&nbsp; Sheba POS & ERP Systems
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
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {shop.shop_name || 'SEBA TECHNOLOGY'}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {shop.address || 'Aruail South Market, Sarail'}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    Tel: {shop.phone || '01800000000'}
                  </div>
                  <div style={{ margin: '6px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', fontWeight: 'bold', fontSize: '11px' }}>
                    SERVICE & INSTALLATION SLIP
                  </div>
                </div>

                {/* Job Info */}
                <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                  <div>Job Code : <strong>{project.project_code}</strong></div>
                  <div>Category : {project.invoice_id ? 'NEW SETUP' : 'REPAIR'}</div>
                  {project.invoice_no && <div>Invoice  : {project.invoice_no}</div>}
                  <div>Date     : {new Date(project.created_at || new Date()).toLocaleDateString('en-GB')}</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', marginBottom: '6px' }}></div>

                {/* Client */}
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>[ CLIENT & SITE ]</div>
                <div style={{ fontSize: '10px' }}>Name: {project.customer_name}</div>
                <div style={{ fontSize: '10px' }}>Tel : {project.site_phone || project.customer_phone}</div>
                {project.site_address && <div style={{ fontSize: '9px' }}>Loc : {project.site_address}</div>}

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                {/* Technician */}
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>[ TECHNICIAN ]</div>
                <div style={{ fontSize: '10px' }}>Tech: {project.technician_name}</div>
                <div>Status: {project.status?.toUpperCase()}</div>

                {/* Devices */}
                {equipmentList.length > 0 && (
                  <>
                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
                    <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>[ DEVICES ]</div>
                    {equipmentList.map((eq, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                        <span>{eq.product_name}</span>
                        <span>x{eq.quantity}</span>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                {/* Charges */}
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>[ CHARGES ]</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Setup Fee:</span>
                  <span>৳ {setup}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Conveyance:</span>
                  <span>৳ {conv}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Meal Allowance:</span>
                  <span>৳ {meal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dotted #000', marginTop: '2px', paddingTop: '2px' }}>
                  <span>Total Tech Payout:</span>
                  <span>৳ {totalTechPayout}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', fontSize: '12px' }}>
                  <span>Customer Bill:</span>
                  <span>৳ {customerBill}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '14px 0 20px 0' }}></div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '9px', marginTop: '16px' }}>
                  <div style={{ borderTop: '1px dotted #000', width: '90px', paddingTop: '2px' }}>
                    Customer Sign
                  </div>
                  <div style={{ borderTop: '1px dotted #000', width: '90px', paddingTop: '2px' }}>
                    Tech Sign
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '8px' }}>
                  *** Thank You ***
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
