import React from 'react';

export default function PosThermalLayout({
  project,
  shop,
  jobDateStr,
  setup,
  conv,
  meal,
  totalTechPayout,
  customerBill,
  equipmentList,
}) {
  return (
    <div
      style={{
        fontSize: '11px',
        lineHeight: '1.35',
        color: '#000000',
        padding: '12px 10px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {shop.shop_name || 'SHEBA TECHNOLOGY'}
        </div>
        <div style={{ fontSize: '9px', marginTop: '2px' }}>
          {shop.address || 'B-Baria, Dhaka, Bangladesh'}
        </div>
        <div style={{ fontSize: '9px' }}>
          Tel: {shop.phone || '01722578860'}
        </div>
        <div
          style={{
            margin: '6px 0',
            borderTop: '1px dashed #000',
            borderBottom: '1px dashed #000',
            padding: '3px 0',
            fontWeight: 'bold',
            fontSize: '10px',
          }}
        >
          TECHNICAL WORK ORDER & JOB CARD
        </div>
      </div>

      {/* Job Info */}
      <div style={{ fontSize: '9.5px', marginBottom: '6px' }}>
        <div>
          Job Code : <strong>{project.project_code}</strong>
        </div>
        <div>
          Category : {project.invoice_no ? 'NEW SETUP' : 'REPAIR'}
        </div>
        {project.invoice_no && <div>Invoice  : {project.invoice_no}</div>}
        <div>Date     : {jobDateStr}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', marginBottom: '6px' }}></div>

      {/* Client */}
      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
        [ CLIENT & SITE ]
      </div>
      <div style={{ fontSize: '9.5px' }}>Name: {project.customer_name}</div>
      <div style={{ fontSize: '9.5px' }}>
        Tel : {project.site_phone || project.customer_phone || 'N/A'}
      </div>
      {project.site_address && (
        <div style={{ fontSize: '9px' }}>Loc : {project.site_address}</div>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Technician */}
      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
        [ TECHNICIAN ]
      </div>
      <div style={{ fontSize: '9.5px' }}>Tech: {project.technician_name}</div>
      <div style={{ fontSize: '9px' }}>
        Tel : {project.technician_contact || 'N/A'}
      </div>
      <div style={{ fontSize: '9px' }}>
        Status: {project.status?.toUpperCase()}
      </div>

      {/* Devices */}
      {equipmentList.length > 0 && (
        <>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
          <div
            style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}
          >
            [ EQUIPMENT CHECKLIST ]
          </div>
          {equipmentList.map((eq, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
              }}
            >
              <span>{eq.product_name}</span>
              <span>x{eq.quantity} [✓]</span>
            </div>
          ))}
        </>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Charges */}
      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
        [ CHARGES & TERMS ]
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9.5px',
        }}
      >
        <span>Setup Charge:</span>
        <span>৳ {setup}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9.5px',
        }}
      >
        <span>Conveyance:</span>
        <span>৳ {conv}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9.5px',
        }}
      >
        <span>Meal Allowance:</span>
        <span>৳ {meal}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 'bold',
          borderTop: '1px dotted #000',
          marginTop: '2px',
          paddingTop: '2px',
          fontSize: '10px',
        }}
      >
        <span>Total Tech Payout:</span>
        <span>৳ {totalTechPayout}</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 'bold',
          marginTop: '4px',
          fontSize: '11px',
        }}
      >
        <span>Customer Bill:</span>
        <span>৳ {customerBill}</span>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '14px 0 16px 0' }}></div>

      {/* Signatures */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          textAlign: 'center',
          fontSize: '9px',
          marginTop: '12px',
        }}
      >
        <div
          style={{
            borderTop: '1px dotted #000',
            width: '85px',
            paddingTop: '2px',
          }}
        >
          Customer Sign
        </div>
        <div
          style={{
            borderTop: '1px dotted #000',
            width: '85px',
            paddingTop: '2px',
          }}
        >
          Tech Sign
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '10px',
          fontSize: '8px',
          color: '#555',
        }}
      >
        *** Sheba POS & ERP Systems ***
      </div>
    </div>
  );
}
