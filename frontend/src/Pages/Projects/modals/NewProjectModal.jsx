import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import BDPhoneInput from '../../../components/shared/BDPhoneInput';
import { isValidBDPhone } from '../../../utils/phoneUtils';

export default function NewProjectModal({ isOpen, onClose, onSuccess }) {
  const [projectCategory, setProjectCategory] = useState('new_setup'); // 'new_setup' | 'old_repair'
  const [invoices, setInvoices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('CCTV Installation');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [setupCharge, setSetupCharge] = useState(1500);
  const [conveyanceCost, setConveyanceCost] = useState(300);
  const [mealAllowance, setMealAllowance] = useState(200);
  const [customerBillingAmount, setCustomerBillingAmount] = useState(2500);
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load invoices and technicians
  useEffect(() => {
    if (isOpen) {
      setLoadingLookups(true);
      Promise.all([
        fetch(`${API}/projects/invoices-lookup`).catch(() => null),
        fetch(`${API}/projects/technicians-lookup`).catch(() => null)
      ])
        .then(async ([invRes, techRes]) => {
          if (invRes && invRes.ok) {
            const iData = await invRes.json();
            if (iData.success) setInvoices(iData.data || []);
          }
          if (techRes && techRes.ok) {
            const tData = await techRes.json();
            if (tData.success) setTechnicians(tData.data || []);
          }
        })
        .finally(() => setLoadingLookups(false));
    }
  }, [isOpen]);

  // Handle invoice attachment
  const handleSelectInvoice = (invId) => {
    const inv = invoices.find(i => String(i.id) === String(invId));
    if (inv) {
      setSelectedInvoice(inv);
      setTitle(`${inv.customer_name} - New CCTV Setup (${inv.invoice_no})`);
      setCustomerName(inv.customer_name || '');
      setSitePhone(inv.customer_phone || '');
      setSiteAddress(inv.customer_address || '');
      
      // Auto-populate customer billing amount if billed in invoice
      if (Number(inv.setup_charge) > 0) {
        setCustomerBillingAmount(Number(inv.setup_charge));
      }

      // Auto-extract equipment details from invoice items
      const itemsList = (inv.items || []).map(it => ({
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price
      }));
      setEquipmentDetails(itemsList);
    } else {
      setSelectedInvoice(null);
    }
  };

  const totalTechnicianPayout = Number(setupCharge || 0) + Number(conveyanceCost || 0) + Number(mealAllowance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a project title.');
      return;
    }
    if (sitePhone && !isValidBDPhone(sitePhone)) {
      alert('Please enter a valid 10-digit site phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title,
        project_category: projectCategory,
        project_type: projectType,
        invoice_id: selectedInvoice ? selectedInvoice.id : null,
        invoice_no: selectedInvoice ? selectedInvoice.invoice_no : null,
        customer_id: selectedInvoice ? selectedInvoice.customer_id : null,
        customer_name: customerName,
        site_phone: sitePhone,
        site_address: siteAddress,
        technician_id: technicianId ? Number(technicianId) : null,
        setup_charge: Number(setupCharge || 0),
        conveyance_cost: Number(conveyanceCost || 0),
        meal_allowance: Number(mealAllowance || 0),
        customer_billing_amount: Number(customerBillingAmount || 0),
        equipment_details: equipmentDetails,
        description,
        start_date: startDate,
        deadline: deadline || null
      };

      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Project created and assigned successfully!');
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Failed to create project.');
      }
    } catch (err) {
      console.error(err);
      alert('Server error creating project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              New Project / Service Entry & Technician Handover
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Attach invoice, configure setup fees, conveyance, meal allowance, and assign technician for work order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* CATEGORY SWITCHER PILLS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setProjectCategory('new_setup');
                setProjectType('CCTV Installation');
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: projectCategory === 'new_setup' ? '#0284c7' : 'transparent',
                color: projectCategory === 'new_setup' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📦</span>
              <span>New Setup (Invoice Reference)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProjectCategory('old_repair');
                setProjectType('Repair & Servicing');
                setSelectedInvoice(null);
                setEquipmentDetails([]);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: projectCategory === 'old_repair' ? '#0284c7' : 'transparent',
                color: projectCategory === 'old_repair' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🔧</span>
              <span>Existing Setup Repair & Maintenance</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* SECTION 1: INVOICE REFERENCE (ONLY FOR NEW SETUP) */}
            {projectCategory === 'new_setup' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                  🔗 Select Sales Invoice (Customer & equipment details will auto-load):
                </label>
                <select
                  value={selectedInvoice?.id || ''}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="">-- Select Recent Invoice --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_no} — {inv.customer_name} ({inv.customer_phone || 'No Phone'}) — ৳ {Number(inv.total_amount || 0).toLocaleString('en-BD')}{Number(inv.setup_charge) > 0 ? ` [Setup Fee: ৳${Number(inv.setup_charge).toLocaleString('en-BD')}]` : ''}
                    </option>
                  ))}
                </select>

                {/* Attached items preview */}
                {selectedInvoice && (
                  <div style={{ marginTop: '10px', background: '#fff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #dbeafe' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>
                      📋 Invoice Equipment Items ({equipmentDetails.length} Items):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {equipmentDetails.map((it, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.76rem', color: '#1e293b' }}>
                          ✓ {it.product_name} <strong>({it.quantity} units)</strong>
                        </span>
                      ))}
                    </div>
                    {Number(selectedInvoice.setup_charge) > 0 && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.78rem', color: '#065f46', fontWeight: 700 }}>
                        🏷️ Setup Charge from Invoice: ৳ {Number(selectedInvoice.setup_charge).toLocaleString('en-BD')} (Populated in customer billing)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: BASIC INFO & SITE DETAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Job Title / Work Order Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Residence - 4x CCTV Setup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Customer / Site Owner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <BDPhoneInput
                  label="Site Phone Number"
                  placeholder="1X-XXXXXXXX"
                  value={sitePhone}
                  onChange={(e) => setSitePhone(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Job / Service Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="CCTV Installation">CCTV Installation (New Camera Setup)</option>
                  <option value="Repair & Servicing">Repair & Servicing (Troubleshooting)</option>
                  <option value="Networking Setup">Networking & WiFi Setup</option>
                  <option value="Maintenance Visit">Maintenance Visit (Routine Check)</option>
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

            {/* SECTION 3: TECHNICIAN REMUNERATION & EXPENSE BREAKDOWN */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  💼 Technician Remuneration & Payout Breakdown
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Automatically credited to technician wallet upon completion
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                    Setup Fee (৳) *
                  </label>
                  <input
                    type="number"
                    value={setupCharge}
                    onChange={(e) => setSetupCharge(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                    Conveyance (৳) *
                  </label>
                  <input
                    type="number"
                    value={conveyanceCost}
                    onChange={(e) => setConveyanceCost(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                    Meal Allowance (৳) *
                  </label>
                  <input
                    type="number"
                    value={mealAllowance}
                    onChange={(e) => setMealAllowance(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#166534', marginBottom: '2px' }}>
                    Customer Service Bill (৳)
                  </label>
                  <input
                    type="number"
                    value={customerBillingAmount}
                    onChange={(e) => setCustomerBillingAmount(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '0.84rem', background: '#f0fdf4', color: '#166534', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Total Calculation Highlight */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  Total Technician Payout (Setup + Conveyance + Meal):
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#0284c7' }}>
                  ৳ {totalTechnicianPayout.toLocaleString('en-BD')}
                </strong>
              </div>
            </div>

            {/* SECTION 4: ASSIGN TECHNICIAN & SCHEDULE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Assign Technician *
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.contact || t.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Estimated Completion Date (Deadline)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Notes / Special Instructions */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Special Instructions / Problem Description
              </label>
              <textarea
                rows="2"
                placeholder="e.g. 4 cameras around 3-story building, configure WiFi router..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}
              >
                {submitting ? 'Assigning...' : 'Handover & Assign Work Order ➔'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
