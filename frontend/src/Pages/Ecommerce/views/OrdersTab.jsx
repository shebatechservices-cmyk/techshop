import React from 'react';
import OrdersFilterBar from './orders/OrdersFilterBar';
import OrderTableRow from './orders/OrderTableRow';

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
  isTechnician = false,
  taka,
}) {
  return (
    <div>
      <OrdersFilterBar
        orders={orders}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        courierFilter={courierFilter}
        setCourierFilter={setCourierFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        STATUS_CONFIG={STATUS_CONFIG}
      />

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-10 px-5 text-center text-slate-500">
            <span className="text-2xl block mb-2">⏳</span>
            Loading e-commerce orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 px-5 text-center text-slate-400">
            <span className="text-4xl block mb-2.5">📦</span>
            <p className="m-0 font-bold text-base text-slate-700">
              No online orders match your filters
            </p>
            <p className="mt-1 mb-4 text-xs">
              Create an online order or adjust your search and status filters above.
            </p>
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              + Create First Online Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-extrabold tracking-wider uppercase">
                  <th className="px-3.5 py-3">ORDER # &amp; DATE</th>
                  <th className="px-3.5 py-3">CUSTOMER</th>
                  <th className="px-3.5 py-3">ITEMS</th>
                  <th className="px-3.5 py-3">SHIPPING &amp; COURIER</th>
                  <th className="px-3.5 py-3 text-center">PAYMENT</th>
                  <th className="px-3.5 py-3 text-right">TOTAL</th>
                  <th className="px-3.5 py-3 text-center">STATUS</th>
                  <th className="px-3.5 py-3 text-center w-[130px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <OrderTableRow
                    key={o.id}
                    order={o}
                    taka={taka}
                    isTechnician={isTechnician}
                    handleQuickStatusChange={handleQuickStatusChange}
                    setSelectedOrderDetails={setSelectedOrderDetails}
                    setPrintOrder={setPrintOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
