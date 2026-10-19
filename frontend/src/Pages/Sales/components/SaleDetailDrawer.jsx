import React, { useEffect } from 'react';
import SaleDetailHeader from './drawer/SaleDetailHeader';
import SaleDetailActionBar from './drawer/SaleDetailActionBar';
import SaleDetailCustomerCard from './drawer/SaleDetailCustomerCard';
import SaleDetailItemsList from './drawer/SaleDetailItemsList';
import SaleDetailExchangeCard from './drawer/SaleDetailExchangeCard';
import SaleDetailFinancialSummary from './drawer/SaleDetailFinancialSummary';

export default function SaleDetailDrawer({
  isOpen,
  onClose,
  sale,
  loading = false,
  onPrint,
  onEdit,
  onCollectDue,
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

  const due = Number(sale?.due_amount || 0);
  const paid = Number(sale?.paid_amount || 0);
  const grandTotal = Number(sale?.total_amount || sale?.grand_total || 0);
  const discount = Number(sale?.discount_amount || sale?.discount || 0);
  const subtotal = grandTotal + discount;

  const isRefund =
    String(sale?.payment_status || '').toLowerCase() === 'refunded' ||
    Boolean(sale?.exchange_from_invoice_no && grandTotal === 0 && paid > 0);

  const getStatusBadge = () => {
    const status = String(sale?.payment_status || '').toUpperCase();
    if (isRefund) {
      return { label: 'REFUNDED', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
    if (status === 'EXCHANGED') {
      return { label: 'EXCHANGED', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    }
    if (status === 'PAID' || due <= 0) {
      return { label: 'PAID', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (status === 'PARTIAL' || (paid > 0 && due > 0)) {
      return { label: 'PARTIAL', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    return { label: 'DUE', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
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
          <SaleDetailHeader sale={sale} statusBadge={statusBadge} onClose={onClose} />

          <SaleDetailActionBar
            sale={sale}
            due={due}
            onPrint={onPrint}
            onEdit={onEdit}
            onCollectDue={onCollectDue}
          />

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
            {loading ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading complete invoice details...</p>
              </div>
            ) : !sale ? (
              <div className="text-center py-16 text-slate-400">No sale selected</div>
            ) : (
              <>
                <SaleDetailCustomerCard sale={sale} taka={taka} onCollectDue={onCollectDue} />
                <SaleDetailItemsList sale={sale} taka={taka} />
                <SaleDetailExchangeCard
                  sale={sale}
                  taka={taka}
                  isRefund={isRefund}
                  paid={paid}
                />
                <SaleDetailFinancialSummary
                  sale={sale}
                  taka={taka}
                  subtotal={subtotal}
                  discount={discount}
                  grandTotal={grandTotal}
                  paid={paid}
                  due={due}
                  isRefund={isRefund}
                  onCollectDue={onCollectDue}
                />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
