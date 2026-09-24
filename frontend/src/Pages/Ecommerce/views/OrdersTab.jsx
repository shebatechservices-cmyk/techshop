import React from 'react';

export default function OrdersTab({
  orders,
  filteredOrders,
  loading,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  courierFilter,
  setCourierFilter,
  paymentFilter,
  setPaymentFilter,
  STATUS_CONFIG,
  handleQuickStatusChange,
  setSelectedOrderDetails,
  setPrintOrder,
  setIsNewOrderModalOpen,
  taka,
}) {
  return (
    <div>
      {/* Status Filter Badges / Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
        {Object.keys(STATUS_CONFIG).map((st) => {
          const cfg = STATUS_CONFIG[st];
          const count =
            st === 'all'
              ? orders.length
              : orders.filter((o) => (o.order_status || 'pending').toLowerCase() === st).length;
          const isActive = statusFilter === st;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: isActive ? `1.5px solid ${cfg.color}` : '1px solid #cbd5e1',
                background: isActive ? cfg.bg : '#ffffff',
                color: isActive ? cfg.color : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{cfg.label}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  background: isActive ? '#ffffff' : '#f1f5f9',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search Order #, Customer, Phone, Tracking..."
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff' }}
          >
            <option value="all">All Couriers</option>
            <option value="Steadfast">Steadfast Courier</option>
            <option value="Pathao">Pathao Courier</option>
            <option value="RedX">RedX Delivery</option>
            <option value="Sundarban">Sundarban Courier</option>
            <option value="Paperfly">Paperfly</option>
            <option value="In-house">In-house / Merchant</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff' }}
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid / COD</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>⏳</span>
            Loading e-commerce orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#475569' }}>
              No online orders match your filters
            </p>
            <p style={{ margin: '4px 0 16px 0', fontSize: '0.85rem' }}>
              Create an online order or adjust your search and status filters above.
            </p>
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(true)}
              style={{
                padding: '8px 18px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              + Create First Online Order
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px' }}>ORDER # &amp; DATE</th>
                  <th style={{ padding: '12px 14px' }}>CUSTOMER</th>
                  <th style={{ padding: '12px 14px' }}>ITEMS</th>
                  <th style={{ padding: '12px 14px' }}>SHIPPING &amp; COURIER</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>PAYMENT</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '130px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => {
                  const status = (o.order_status || 'pending').toLowerCase();
                  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  const isPaid = (o.payment_status || '').toLowerCase() === 'paid';
                  const itemsCount = (o.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);

                  // Raw phone for WhatsApp
                  const rawPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
                  const bdPhone = rawPhone.startsWith('880') ? rawPhone : (rawPhone.startsWith('0') ? `88${rawPhone}` : `880${rawPhone}`);
                  const waUrl = `https://wa.me/${bdPhone}?text=Hello%20${encodeURIComponent(o.customer_name || 'Customer')},%20regarding%20order%20%23${encodeURIComponent(o.order_no || o.id)}`;

                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fcfcfd')}
                    >
                      {/* ORDER # & DATE */}
                      <td style={{ padding: '12px 14px' }}>
                        <div
                          onClick={() => setSelectedOrderDetails(o)}
                          style={{ fontWeight: 800, color: '#0d9488', cursor: 'pointer' }}
                        >
                          #{o.order_no || o.order_number || o.id}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                      </td>

                      {/* CUSTOMER & CONTACTS */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.customer_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#475569' }}>{o.customer_phone}</span>
                          <a
                            href={`tel:${o.customer_phone}`}
                            title="Call customer"
                            style={{ fontSize: '0.72rem', textDecoration: 'none', padding: '1px 5px', background: '#f1f5f9', borderRadius: '4px', color: '#0284c7' }}
                          >
                            📞
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send WhatsApp Message"
                            style={{ fontSize: '0.72rem', textDecoration: 'none', padding: '1px 5px', background: '#dcfce7', borderRadius: '4px', color: '#16a34a' }}
                          >
                            💬
                          </a>
                        </div>
                      </td>

                      {/* ITEMS SUMMARY */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(o.items || []).map((it) => `${it.product_name || 'Product'} (x${it.quantity})`).join(', ') || 'Online package'}
                        </div>
                      </td>

                      {/* SHIPPING & COURIER */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          🚚 {o.courier_name || 'Standard Courier'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📍 {o.shipping_address}
                        </div>
                        {o.tracking_code && (
                          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                            CN: {o.tracking_code}
                          </div>
                        )}
                      </td>

                      {/* PAYMENT */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: isPaid ? '#dcfce7' : '#fef3c7',
                            color: isPaid ? '#15803d' : '#b45309',
                          }}
                        >
                          {isPaid ? '✓ Paid' : (o.payment_method ? `${o.payment_method.toUpperCase()} / COD` : 'COD')}
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {taka(o.total_amount)}
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <select
                          value={status}
                          onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            border: `1px solid ${statusCfg.color}`,
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            title="View full order details"
                            style={{
                              padding: '4px 8px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintOrder(o)}
                            title="Print Packing Slip / Label"
                            style={{
                              padding: '4px 8px',
                              background: '#f0fdfa',
                              border: '1px solid #99f6e4',
                              borderRadius: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#0d9488',
                              cursor: 'pointer',
                            }}
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
