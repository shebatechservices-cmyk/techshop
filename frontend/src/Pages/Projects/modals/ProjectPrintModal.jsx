import React, { useState, useEffect } from 'react';
import API, { getAuthHeaders } from '../../../services/api';
import { getPrintStyles } from './print/styles/printStyles';
import A4WorkOrderSheet from './print/layouts/A4WorkOrderSheet';
import PosThermalLayout from './print/layouts/PosThermalLayout';

export default function ProjectPrintModal({ isOpen, onClose, project }) {
  // Layout modes: "a4_jobcard" (Office/Tech Job Card) | "a4_customer" (Customer Handover Slip) | "pos_thermal" (80mm Thermal Slip)
  const [layout, setLayout] = useState('a4_jobcard');
  const [shop, setShop] = useState({
    shop_name: 'Sheba Technology & Networking',
    shop_title: 'Professional CCTV, IT & Network Solutions',
    phone: '01722578860',
    address: 'B-Baria, Dhaka, Bangladesh',
  });

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`, { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) {
            setShop((prev) => ({
              ...prev,
              ...json.data,
            }));
          }
        })
        .catch((err) =>
          console.error('Failed to load shop settings for print:', err)
        );
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const setup = parseFloat(project.setup_charge || project.setup_fee || 0);
  const conv = parseFloat(project.conveyance_cost || project.conveyance || 0);
  const meal = parseFloat(project.meal_allowance || 0);
  const totalTechPayout =
    setup + conv + meal > 0 ? setup + conv + meal : parseFloat(project.charges || 0);
  const customerBill = parseFloat(project.customer_billing_amount || 0);

  const equipmentList = Array.isArray(project.equipment_details)
    ? project.equipment_details
    : typeof project.equipment_details === 'string'
    ? JSON.parse(project.equipment_details || '[]')
    : [];

  const servicesList = Array.isArray(project.services) ? project.services : [];

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

  const jobDateStr = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  const startDateStr = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate';

  return (
    <div
      id="project-print-modal-container"
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
        padding: '16px',
      }}
      onClick={onClose}
    >
      {/* Print Specific CSS Rules */}
      <style>{getPrintStyles(layout)}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: layout === 'pos_thermal' ? '460px' : '900px',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          transition: 'max-width 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP TOOLBAR - NO PRINT */}
        <div
          className="no-print"
          style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🖨️</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  letterSpacing: '-0.01em',
                }}
              >
                Print Work Order & Job Card
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Job: <strong style={{ color: '#38bdf8' }}>{project.project_code}</strong> •{' '}
                {project.customer_name}
              </p>
            </div>
          </div>

          {/* LAYOUT SWITCHER */}
          <div
            style={{
              display: 'flex',
              background: '#334155',
              padding: '3px',
              borderRadius: '8px',
              gap: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => setLayout('a4_jobcard')}
              style={{
                background: layout === 'a4_jobcard' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📄</span>
              <span>A4 Technical Job Card</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('a4_customer')}
              style={{
                background: layout === 'a4_customer' ? '#2563eb' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📋</span>
              <span>Customer Handover Copy</span>
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
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🧾</span>
              <span>80mm Thermal Slip</span>
            </button>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '7px 18px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.4)',
              }}
            >
              <span>🖨️</span>
              <span>Print Sheet</span>
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
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="project-print-preview-container">
          <div
            id="project-print-sheet"
            style={{
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              borderRadius: layout === 'pos_thermal' ? '4px' : '6px',
              width: layout === 'pos_thermal' ? '320px' : '100%',
              maxWidth: layout === 'pos_thermal' ? '320px' : '780px',
              fontFamily:
                layout === 'pos_thermal'
                  ? 'monospace, Courier, sans-serif'
                  : 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          >
            {layout !== 'pos_thermal' ? (
              <A4WorkOrderSheet
                project={project}
                shop={shop}
                layout={layout}
                jobDateStr={jobDateStr}
                startDateStr={startDateStr}
                printDateStr={printDateStr}
                setup={setup}
                conv={conv}
                meal={meal}
                totalTechPayout={totalTechPayout}
                customerBill={customerBill}
                equipmentList={equipmentList}
                servicesList={servicesList}
              />
            ) : (
              <PosThermalLayout
                project={project}
                shop={shop}
                jobDateStr={jobDateStr}
                setup={setup}
                conv={conv}
                meal={meal}
                totalTechPayout={totalTechPayout}
                customerBill={customerBill}
                equipmentList={equipmentList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
