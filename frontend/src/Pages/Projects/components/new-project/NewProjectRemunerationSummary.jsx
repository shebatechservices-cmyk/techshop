import React from 'react';

export default function NewProjectRemunerationSummary({
  conveyanceCost,
  setConveyanceCost,
  mealAllowance,
  setMealAllowance,
  customerBillingAmount,
  setCustomerBillingAmount,
  totalTechnicianPayout = 0
}) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      {/* Additional Remunerations & Billing Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
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
          Total Technician Payout (Setup Tasks + Conveyance + Meal):
        </span>
        <strong style={{ fontSize: '1.15rem', color: '#0284c7' }}>
          ৳ {Number(totalTechnicianPayout || 0).toLocaleString('en-BD')}
        </strong>
      </div>
    </div>
  );
}
