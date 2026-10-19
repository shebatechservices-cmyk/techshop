import React from 'react';
import TableActionDropdown from '../../../../components/ui/TableActionDropdown';

export default function PurchaseTableRow({
  order,
  handleOpenOrderDrawer,
  handleOpenPrintOrder,
  handleEditOrder,
  handleDeleteOrder,
}) {
  const hoursOld = order.created_at
    ? (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
    : 0;
  const isEditable = !order.created_at || hoursOld <= 360; // 15 days
  const isDeletable = !order.created_at || hoursOld <= 168; // 7 days

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
        <button
          type="button"
          onClick={() =>
            handleOpenOrderDrawer
              ? handleOpenOrderDrawer(order)
              : handleOpenPrintOrder(order.id)
          }
          title="Click to view purchase order in sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            font: 'inherit',
            fontWeight: 700,
            color: '#0284c7',
            cursor: 'pointer',
            textAlign: 'left',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}
        >
          {order.po_number}
        </button>
      </td>
      <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 600 }}>
        {order.supplier_name || `Supplier #${order.supplier_id}`}
      </td>
      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
      </td>
      <td style={{ padding: '12px 16px', color: '#475569' }}>
        {order.item_count} Items ({order.unit_count} Units)
      </td>
      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
        ৳ {Number(order.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 700 }}>
        ৳ {Number(order.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ padding: '12px 16px', color: Number(order.total_due) > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
        ৳ {Number(order.total_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            background: '#dcfce7',
            color: '#15803d',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}
        >
          {order.status || 'Approved'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <TableActionDropdown
          triggerLabel="⋮"
          triggerTitle="Purchase Order Actions"
          triggerClassName="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
          items={[
            {
              key: 'view',
              label: 'Quick View',
              icon: '👁️',
              className: 'text-sky-700 hover:bg-sky-50 font-bold',
              onClick: () =>
                handleOpenOrderDrawer
                  ? handleOpenOrderDrawer(order)
                  : handleOpenPrintOrder(order.id),
            },
            {
              key: 'print',
              label: 'Print / Preview',
              icon: '🖨️',
              className: 'text-slate-700 hover:bg-slate-50',
              onClick: () => handleOpenPrintOrder(order.id),
            },
            {
              key: 'edit',
              label: 'Edit Order',
              icon: '✏️',
              disabled: !isEditable,
              title: isEditable
                ? 'Edit purchase order (15-day window)'
                : 'Edit window closed — orders only editable within 15 days of creation',
              className: isEditable ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400',
              onClick: () => handleEditOrder(order),
            },
            {
              key: 'delete',
              label: 'Delete Order',
              icon: '🗑️',
              danger: true,
              disabled: !isDeletable,
              title: isDeletable
                ? 'Delete purchase order (7-day window)'
                : 'Deletion window closed — orders only deletable within 7 days of creation',
              className: isDeletable ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-400',
              onClick: () => handleDeleteOrder(order.id, order),
            },
          ]}
        />
      </td>
    </tr>
  );
}
