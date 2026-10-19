import React, { useState, useEffect } from 'react';
import PurchaseStatsBar from './history/PurchaseStatsBar';
import PurchaseTableRow from './history/PurchaseTableRow';
import PaginationControls from '../../../components/ui/PaginationControls';

const PAGE_SIZE = 20;

export default function PurchaseHistoryTab({
  orders = [],
  filteredOrders = [],
  loading = false,
  searchQuery = '',
  setSearchQuery,
  loadAllData,
  setIsOrderModalOpen,
  handleOpenPrintOrder,
  handleOpenOrderDrawer,
  handleEditOrder,
  handleDeleteOrder,
  totalPurchasesCost = 0,
  totalPurchasesPaid = 0,
  totalPurchasesDue = 0,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  return (
    <div>
      {/* Stats Bar */}
      <PurchaseStatsBar
        totalPurchasesCost={totalPurchasesCost}
        totalPurchasesPaid={totalPurchasesPaid}
        totalPurchasesDue={totalPurchasesDue}
        ordersCount={orders.length}
      />

      {/* Search & Refresh Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO number, supplier..."
            style={{
              maxWidth: '320px',
              width: '100%',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#ffffff',
            }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7', background: '#f0f9ff', padding: '4px 10px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
            Showing {filteredOrders.length} of {orders.length} Orders
          </span>
        </div>

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

      {/* Table & Pagination Container */}
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
          <>
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
                  {paginatedOrders.map((order) => (
                    <PurchaseTableRow
                      key={order.id}
                      order={order}
                      handleOpenOrderDrawer={handleOpenOrderDrawer}
                      handleOpenPrintOrder={handleOpenPrintOrder}
                      handleEditOrder={handleEditOrder}
                      handleDeleteOrder={handleDeleteOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={filteredOrders.length}
              onPageChange={setCurrentPage}
              itemName="purchase orders"
            />
          </>
        )}
      </div>
    </div>
  );
}
