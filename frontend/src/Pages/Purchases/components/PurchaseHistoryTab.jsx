import React from 'react';
import TableActionDropdown from '../../../components/ui/TableActionDropdown';

export default function PurchaseHistoryTab({
  orders,
  filteredOrders,
  loading,
  searchQuery,
  setSearchQuery,
  loadAllData,
  setIsOrderModalOpen,
  openActionOrderId,
  setOpenActionOrderId,
  handleOpenPrintOrder,
  handleEditOrder,
  handleDeleteOrder,
  totalPurchasesCost,
  totalPurchasesPaid,
  totalPurchasesDue,
}) {
  return (
    <div>
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Purchase Cost
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0284c7', fontWeight: 800 }}>
            ৳ {totalPurchasesCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Paid to Suppliers
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
            ৳ {totalPurchasesPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Outstanding Due
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: totalPurchasesDue > 0 ? '#ef4444' : '#64748b', fontWeight: 800 }}>
            ৳ {totalPurchasesDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Orders Placed
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
            {orders.length}
          </h3>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by PO number, supplier..."
          style={{
            maxWidth: '300px',
            width: '100%',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <button
          onClick={loadAllData}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#475569',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading purchase history...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No purchase orders found</p>
            <button
              onClick={() => setIsOrderModalOpen(true)}
              style={{
                marginTop: '12px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Create First Purchase Order
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>PO Number</th>
                  <th style={{ padding: '12px 16px' }}>Supplier</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Items / Units</th>
                  <th style={{ padding: '12px 16px' }}>Total Cost</th>
                  <th style={{ padding: '12px 16px' }}>Paid</th>
                  <th style={{ padding: '12px 16px' }}>Due</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                      {order.po_number}
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
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}>
                        {order.status || 'Approved'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {(() => {
                        const hoursOld = order.created_at ? (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60) : 0;
                        const isEditable = !order.created_at || hoursOld <= 360; // 15 days
                        const isDeletable = !order.created_at || hoursOld <= 168; // 7 days

                        return (
                          <TableActionDropdown
                            triggerLabel="⋮"
                            triggerTitle="Purchase Order Actions"
                            triggerClassName="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-sm font-extrabold text-slate-700 hover:bg-slate-100"
                            items={[
                              {
                                key: 'print',
                                label: 'Print / Preview',
                                icon: '🖨️',
                                className: 'text-sky-600 hover:bg-sky-50',
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
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
