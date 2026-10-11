import React from 'react';

export default function A4WorkOrderSheet({
  project,
  shop,
  layout,
  jobDateStr,
  startDateStr,
  printDateStr,
  setup,
  conv,
  meal,
  totalTechPayout,
  customerBill,
  equipmentList,
  servicesList,
}) {
  const isCustomerCopy = layout === 'a4_customer';

  return (
    <div
      style={{
        border: '1.5px solid #0f172a',
        borderRadius: '4px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        background: '#ffffff',
        minHeight: '272mm',
        maxHeight: '275mm',
      }}
    >
      {/* 1. TOP HEADER & CORPORATE BRANDING */}
      <div>
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #1e3a8a 0%, #0284c7 50%, #16a34a 100%)',
            marginBottom: '10px',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1.5px solid #0f172a',
            paddingBottom: '10px',
            marginBottom: '12px',
          }}
        >
          <div style={{ maxWidth: '60%' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.45rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {shop.shop_name || 'Sheba Technology & Networking'}
            </h1>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#2563eb',
                fontWeight: 700,
                marginTop: '1px',
              }}
            >
              {shop.shop_title || 'Professional CCTV, IT & Network Solutions'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#475569',
                marginTop: '3px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span>📍 {shop.address || 'B-Baria, Dhaka, Bangladesh'}</span>
              <span>•</span>
              <span>📞 {shop.phone || '01722578860'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                background: '#0f172a',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {isCustomerCopy
                ? 'CUSTOMER DELIVERY & HANDOVER SLIP'
                : 'TECHNICAL WORK ORDER & JOB CARD'}
            </div>
            <div
              style={{
                marginTop: '5px',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              Job Code:{' '}
              <span
                style={{
                  color: '#1d4ed8',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                }}
              >
                {project.project_code}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#64748b',
                marginTop: '2px',
              }}
            >
              Date: <strong>{jobDateStr}</strong>
            </div>
          </div>
        </div>

        {/* 2. JOB TITLE & SCOPE BANNER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderLeft: '4px solid #2563eb',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                color: '#64748b',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.03em',
              }}
            >
              Work Order Title & Scope
            </div>
            <div
              style={{
                fontSize: '0.98rem',
                fontWeight: 800,
                color: '#0f172a',
                marginTop: '1px',
              }}
            >
              {project.title}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                padding: '4px 9px',
                borderRadius: '5px',
                fontSize: '0.73rem',
                fontWeight: 800,
                background: project.invoice_no ? '#eff6ff' : '#fef3c7',
                color: project.invoice_no ? '#1e40af' : '#92400e',
                border: project.invoice_no
                  ? '1px solid #bfdbfe'
                  : '1px solid #fde68a',
              }}
            >
              {project.invoice_no
                ? `📦 Invoice Linked: #${project.invoice_no}`
                : '🔧 Direct Service & Maintenance'}
            </span>
          </div>
        </div>

        {/* 3. TWO-COLUMN: CLIENT & TECHNICIAN INFORMATION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          {/* Client & Site */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                background: '#f1f5f9',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>👤</span>
              <span>Customer & Site Details</span>
            </div>
            <div
              style={{
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex' }}>
                <span style={{ width: '105px', color: '#64748b' }}>Customer Name:</span>
                <strong style={{ color: '#0f172a' }}>{project.customer_name}</strong>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '105px', color: '#64748b' }}>Contact Phone:</span>
                <strong style={{ color: '#16a34a' }}>
                  {project.site_phone || project.customer_phone || 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '105px', color: '#64748b' }}>Site Location:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {project.site_address || 'On-site'}
                </span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '105px', color: '#64748b' }}>Service Scope:</span>
                <span style={{ color: '#1e40af', fontWeight: 700 }}>
                  {project.project_type || 'CCTV Installation'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Technician & Schedule */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                background: '#f1f5f9',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>👷</span>
              <span>Assigned Technician & Schedule</span>
            </div>
            <div
              style={{
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex' }}>
                <span style={{ width: '115px', color: '#64748b' }}>Lead Technician:</span>
                <strong style={{ color: '#0f172a' }}>{project.technician_name}</strong>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '115px', color: '#64748b' }}>Tech Contact:</span>
                <strong style={{ color: '#0f172a' }}>
                  {project.technician_contact || 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '115px', color: '#64748b' }}>Scheduled Date:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{startDateStr}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '115px', color: '#64748b' }}>Order Status:</span>
                <strong
                  style={{
                    color: project.status === 'completed' ? '#16a34a' : '#2563eb',
                    textTransform: 'capitalize',
                  }}
                >
                  {project.status === 'completed'
                    ? '✓ Completed'
                    : project.status?.replace('_', ' ') || 'Assigned'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4. INSTALLATION CHECKLIST & EQUIPMENT */}
        {equipmentList.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📋</span>
              <span>Installation Equipment & Device Checklist</span>
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.77rem',
                border: '1px solid #cbd5e1',
              }}
            >
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'center', width: '35px' }}>#</th>
                  <th style={{ padding: '5px 8px', textAlign: 'left' }}>
                    Product / Device Description
                  </th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', width: '75px' }}>
                    Quantity
                  </th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', width: '140px' }}>
                    Installation Verification
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((eq, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td
                      style={{
                        padding: '4px 8px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      {i + 1}
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 700, color: '#1e293b' }}>
                      {eq.product_name}
                    </td>
                    <td
                      style={{
                        padding: '4px 8px',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      {eq.quantity} pcs
                    </td>
                    <td
                      style={{
                        padding: '4px 8px',
                        textAlign: 'center',
                        color: '#1e40af',
                        fontWeight: 600,
                        fontSize: '0.74rem',
                      }}
                    >
                      [&nbsp;✓&nbsp;] Installed & Tested
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4.1 SERVICES / TASKS BREAKDOWN */}
        {servicesList.length > 0 && equipmentList.length === 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#0f172a',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              📋 Service Tasks Breakdown
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.77rem',
                border: '1px solid #cbd5e1',
              }}
            >
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'center', width: '35px' }}>#</th>
                  <th style={{ padding: '5px 8px', textAlign: 'left' }}>Service Description</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center', width: '60px' }}>Qty</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right', width: '90px' }}>Rate</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right', width: '90px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {servicesList.map((srv, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td
                      style={{
                        padding: '4px 8px',
                        textAlign: 'center',
                        color: '#64748b',
                      }}
                    >
                      {i + 1}
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 700 }}>{srv.service_name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{srv.quantity}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                      ৳ {Number(srv.unit_rate || 0).toLocaleString('en-IN')}
                    </td>
                    <td
                      style={{
                        padding: '4px 8px',
                        textAlign: 'right',
                        fontWeight: 700,
                      }}
                    >
                      ৳ {Number(srv.line_total || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. JOB DESCRIPTION / SPECIAL NOTES */}
        {project.description && (
          <div
            style={{
              marginBottom: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '6px 10px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Job Instructions & Technical Notes:
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                color: '#1e293b',
                marginTop: '2px',
                whiteSpace: 'pre-line',
              }}
            >
              {project.description}
            </div>
          </div>
        )}

        {/* 6. FINANCIAL & BILLING TERMS */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isCustomerCopy ? '1fr' : '1fr 1fr',
              gap: '10px',
            }}
          >
            {/* Technician Remuneration Breakdown (Hidden in Customer Copy) */}
            {!isCustomerCopy && (
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#eff6ff',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#1e40af',
                    borderBottom: '1px solid #bfdbfe',
                    textTransform: 'uppercase',
                  }}
                >
                  Technician Compensation Breakdown
                </div>
                <div style={{ fontSize: '0.76rem', padding: '4px 10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: '1px dashed #f1f5f9',
                    }}
                  >
                    <span style={{ color: '#475569' }}>Setup / Installation Fee:</span>
                    <strong>৳ {setup.toLocaleString('en-IN')}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: '1px dashed #f1f5f9',
                    }}
                  >
                    <span style={{ color: '#475569' }}>Conveyance / Transport:</span>
                    <strong>৳ {conv.toLocaleString('en-IN')}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: '1px dashed #f1f5f9',
                    }}
                  >
                    <span style={{ color: '#475569' }}>Meal Allowance:</span>
                    <strong>৳ {meal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '3px 0 0',
                      fontWeight: 800,
                      color: '#1e40af',
                      borderTop: '1px solid #cbd5e1',
                      marginTop: '2px',
                    }}
                  >
                    <span>Total Technician Receivable (Wallet):</span>
                    <span style={{ fontSize: '0.85rem' }}>
                      ৳ {totalTechPayout.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Billing Terms */}
            <div
              style={{
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#166534',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Customer Service Billing Summary
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  margin: '3px 0',
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#15803d',
                  }}
                >
                  ৳ {customerBill.toLocaleString('en-IN')}
                </span>
                {customerBill === 0 && project.invoice_no && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: '#166534',
                      fontWeight: 700,
                    }}
                  >
                    (Covered in Invoice #{project.invoice_no})
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#15803d',
                  lineHeight: '1.2',
                }}
              >
                {customerBill > 0
                  ? '• Amount payable upon successful installation and live CCTV verification.'
                  : project.invoice_no
                  ? '• Hardware & installation package billed under official POS Invoice.'
                  : '• Complimentary / standard maintenance work order.'}
              </div>
            </div>
          </div>
        </div>

        {/* 7. CUSTOMER HANDOVER & WARRANTY TERMS */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '5px',
            padding: '6px 10px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}
          >
            Service Handover & Warranty Terms:
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: '#64748b',
              lineHeight: '1.35',
            }}
          >
            1. All equipment inspected, configured, and demonstrated in fully functional state with live viewing.<br />
            2. Warranty terms apply as stated in the primary invoice; electrical surge, lightning, or burn damages are void.<br />
            3. Customer acknowledges complete receipt of materials and satisfactory completion of technical work.
          </div>
        </div>
      </div>

      {/* 8. SIGNATURE SECTION */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '10px',
          }}
        >
          <div style={{ textAlign: 'center', width: '180px' }}>
            <div
              style={{
                borderTop: '1.5px solid #0f172a',
                paddingTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              Customer Acceptance
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
              Received & satisfied with service
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '180px' }}>
            <div
              style={{
                borderTop: '1.5px solid #0f172a',
                paddingTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              Lead Technician
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
              {project.technician_name}
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '180px' }}>
            <div
              style={{
                borderTop: '1.5px solid #0f172a',
                paddingTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              Authorized Signatory
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
              Sheba Technology & Networking
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '0.65rem',
            color: '#94a3b8',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '4px',
          }}
        >
          Printed on: {printDateStr} &nbsp;•&nbsp; Sheba POS & ERP Solutions &nbsp;•&nbsp; Support: {shop.phone}
        </div>
      </div>
    </div>
  );
}
