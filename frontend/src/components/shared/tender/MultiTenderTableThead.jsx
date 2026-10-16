import React from 'react';

export default function MultiTenderTableThead() {
  return (
    <thead>
      <tr
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          color: '#475569',
        }}
      >
        <th
          style={{
            padding: '5px 6px',
            width: '28px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          #
        </th>
        <th
          style={{ padding: '5px 6px', minWidth: '135px', fontWeight: 700 }}
        >
          Payment Method
        </th>
        <th
          style={{ padding: '5px 6px', minWidth: '145px', fontWeight: 700 }}
        >
          Account
        </th>
        <th
          style={{
            padding: '5px 6px',
            width: '120px',
            minWidth: '105px',
            fontWeight: 700,
          }}
        >
          Ref:/Trans. ID
        </th>
        <th
          style={{
            padding: '5px 6px',
            width: '115px',
            minWidth: '100px',
            textAlign: 'right',
            fontWeight: 700,
          }}
        >
          Amount (৳)
        </th>
        <th
          style={{
            padding: '5px 6px',
            width: '70px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          Action
        </th>
      </tr>
    </thead>
  );
}
