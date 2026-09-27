import React from 'react';

export default function NewProjectTechnicianAndSchedule({
  technicians = [],
  technicianId,
  setTechnicianId,
  onOpenAddTech,
  startDate,
  setStartDate,
  deadline,
  setDeadline,
  description,
  setDescription
}) {
  return (
    <>
      {/* Assign Technician & Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.8fr) minmax(130px, 1fr) minmax(160px, 1.3fr)', gap: '14px', marginBottom: '14px', alignItems: 'start' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Assign / Change Technician *
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                background: '#fff'
              }}
            >
              <option value="">-- Select Technician --</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.contact || t.role_title})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenAddTech}
              title="Quick Add New Technician"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: '1px solid #0284c7',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                lineHeight: 1
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0369a1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0284c7'; }}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Deadline / Target Date
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Special Instructions / Site Notes */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
          Job Instructions / Site Notes
        </label>
        <textarea
          rows={2}
          placeholder="Special notes for the technician (e.g., Gate entry pass required, test WiFi range, mount 2 cameras on roof)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
        />
      </div>
    </>
  );
}
