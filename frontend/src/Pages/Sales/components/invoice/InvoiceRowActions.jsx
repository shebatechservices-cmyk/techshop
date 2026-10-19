import React from 'react';
import TableActionDropdown from '../../../../components/ui/TableActionDropdown';

export default function InvoiceRowActions({
  sale,
  saleDue,
  lock,
  isPrinting,
  isEditing,
  isDeleting,
  handleOpenSaleDrawer,
  handleOpenPrintSale,
  handleOpenDuePayment,
  setExchangeSaleId,
  handleInitiateEditSale,
  handleInitiateDeleteSale,
  isAdmin,
  taka,
}) {
  return (
    <div className="flex gap-1.5 justify-center items-center">
      <button
        type="button"
        onClick={() =>
          handleOpenSaleDrawer
            ? handleOpenSaleDrawer(sale)
            : handleOpenPrintSale(sale.id)
        }
        className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg py-1 px-2.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1 transition-colors shadow-2xs"
        title="Quick view invoice in sidebar"
      >
        <span>👁️</span> View
      </button>

      <TableActionDropdown
        triggerLabel={
          isPrinting || isEditing || isDeleting ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
          ) : (
            '⋮'
          )
        }
        triggerTitle="Invoice Actions"
        triggerClassName="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-extrabold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        minWidth="195px"
        items={[
          {
            key: 'view',
            label: 'Quick View (সাইডবার)',
            icon: '👁️',
            className: 'text-sky-700 hover:bg-sky-50 font-bold',
            onClick: () =>
              handleOpenSaleDrawer
                ? handleOpenSaleDrawer(sale)
                : handleOpenPrintSale(sale.id),
          },
          {
            key: 'print',
            label: 'Print Invoice (চালান প্রিন্ট)',
            icon: '🖨️',
            className: 'text-slate-700 hover:bg-slate-50',
            onClick: () => handleOpenPrintSale(sale.id),
          },
          ...(saleDue > 0 && handleOpenDuePayment
            ? [
                {
                  key: 'due',
                  label: `Collect Due (${taka(saleDue)})`,
                  icon: '💳',
                  className: 'text-emerald-700 hover:bg-emerald-50 font-bold',
                  onClick: () => handleOpenDuePayment(sale),
                },
              ]
            : []),
          {
            key: 'exchange',
            label: 'Return / Exchange (পণ্য ফেরত ও বদল)',
            icon: '🔄',
            className: 'text-purple-700 hover:bg-purple-50',
            onClick: () => setExchangeSaleId(sale.id),
          },
          {
            key: 'edit',
            label: lock.isEditLocked ? 'Edit (Locked 🔒)' : 'Edit Sale (এডিট)',
            icon: lock.isEditLocked ? '🔒' : '✏️',
            className: lock.isEditLocked
              ? 'text-amber-700 hover:bg-amber-50 font-medium'
              : 'text-blue-700 hover:bg-blue-50',
            title: lock.isEditLocked
              ? isAdmin
                ? `Locked (${lock.editLockReason}) — Admin Override Available`
                : `Locked: ${lock.editLockReason}`
              : 'Edit invoice',
            onClick: () => handleInitiateEditSale(sale.id, sale),
          },
          { divider: true },
          {
            key: 'delete',
            label: lock.isDeleteLocked ? 'Delete (Locked 🔒)' : 'Delete Sale (মুছুন)',
            icon: '🗑️',
            danger: true,
            className: 'text-rose-600 hover:bg-rose-50 font-medium',
            title: lock.isDeleteLocked
              ? isAdmin
                ? `Locked (${lock.deleteLockReason}) — Admin Override Available`
                : `Locked: ${lock.deleteLockReason}`
              : 'Delete sale invoice',
            onClick: () => handleInitiateDeleteSale(sale.id, sale),
          },
        ]}
      />
    </div>
  );
}
