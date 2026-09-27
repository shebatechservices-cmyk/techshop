import React from 'react';
import { DEFAULT_JOB_TYPES } from '../../utils/projectHelpers';

export default function NewProjectBasicDetails({
  title,
  setTitle,
  customerName,
  setCustomerName,
  sitePhone,
  setSitePhone,
  projectType,
  setProjectType,
  siteAddress,
  setSiteAddress,
  jobTypes = [],
  onOpenManageJobTypes
}) {
  const dynamicJobTypes = jobTypes && jobTypes.length > 0
    ? jobTypes.map(jt => ({
        value: jt.name,
        label: jt.description ? `${jt.name} (${jt.description})` : jt.name
      }))
    : DEFAULT_JOB_TYPES;

  return (
    <>
      {/* Project Title */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
          Project Title / Job Summary *
        </label>
        <input
          type="text"
          placeholder="e.g. Uttara Head Office - 8 CCTV Camera & Network Setup"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
        />
      </div>

      {/* Grid: Customer Name, Site Phone, Job Type */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Customer Name *
          </label>
          <input
            type="text"
            placeholder="Client / Organization Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Site Contact Phone *
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              padding: '8px 10px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#475569',
              userSelect: 'none'
            }}>
              +88
            </span>
            <input
              type="text"
              placeholder="017XXXXXXXX"
              maxLength={11}
              value={sitePhone}
              onChange={(e) => {
                const numericVal = e.target.value.replace(/\D/g, '');
                setSitePhone(numericVal);
              }}
              required
              style={{
                flex: 1,
                minWidth: 0,
                padding: '8px 12px',
                borderRadius: '0 6px 6px 0',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Standard 11-digit number (e.g. 017XXXXXXXX)
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              Job / Service Type
            </label>
            {onOpenManageJobTypes && (
              <button
                type="button"
                onClick={onOpenManageJobTypes}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 2px'
                }}
                title="Manage Job Types"
              >
                ⚙️ Manage
              </button>
            )}
          </div>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          >
            {dynamicJobTypes.map(jt => (
              <option key={jt.value} value={jt.value}>
                {jt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Site Address */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
          Full Site Address / Location
        </label>
        <input
          type="text"
          placeholder="Street, building no., market or area location"
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
        />
      </div>
    </>
  );
}
