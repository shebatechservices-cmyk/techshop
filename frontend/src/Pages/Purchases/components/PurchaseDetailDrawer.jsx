import React, { useEffect } from 'react';
import PurchaseDrawerHeader from './drawer/PurchaseDrawerHeader';
import PurchaseDrawerSupplierCard from './drawer/PurchaseDrawerSupplierCard';
import PurchaseDrawerItemsList from './drawer/PurchaseDrawerItemsList';
import PurchaseDrawerFinancialSummary from './drawer/PurchaseDrawerFinancialSummary';
import PurchaseDrawerPaymentsCard from './drawer/PurchaseDrawerPaymentsCard';

export default function PurchaseDetailDrawer({
  isOpen,
  onClose,
  order,
  loading = false,
  onPrint,
  onEdit,
  taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalPaid = Number(order?.total_paid || 0);
  const totalDue = Number(order?.total_due || 0);

  const getStatusBadge = () => {
    const status = String(order?.status || '').toUpperCase();
    if (status === 'PAID' || totalDue <= 0) {
      return {
        label: 'PAID',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (status === 'PARTIAL' || (totalPaid > 0 && totalDue > 0)) {
      return {
        label: 'PARTIAL',
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    return {
      label: order?.status || 'APPROVED',
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
          <PurchaseDrawerHeader
            order={order}
            statusBadge={statusBadge}
            onClose={onClose}
            onPrint={onPrint}
            onEdit={onEdit}
          />

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
            {loading ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading complete order details...</p>
              </div>
            ) : !order ? (
              <div className="text-center py-16 text-slate-400">No purchase order selected</div>
            ) : (
              <>
                <PurchaseDrawerSupplierCard order={order} taka={taka} />
                <PurchaseDrawerItemsList order={order} taka={taka} />
                <PurchaseDrawerFinancialSummary order={order} taka={taka} />
                <PurchaseDrawerPaymentsCard payments={order.payments} taka={taka} />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
