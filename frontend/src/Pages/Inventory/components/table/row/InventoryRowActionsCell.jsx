import React from 'react';
import TableActionDropdown from '../../../../../components/ui/TableActionDropdown';

export default function InventoryRowActionsCell({
  product: p,
  isTechnician,
  handleToggleEcommerce,
  onViewProductDetails,
  onOpenNewQuotation,
  onOpenNewSale,
  handleOpenLabelModal,
  handleOpenTransferModal
}) {
  return (
    <>
      {/* 8. E-Commerce Interactive Toggle */}
      <td className="py-1 px-1.5 text-center align-middle">
        {isTechnician ? (
          <span
            className={`py-0.5 px-1.5 rounded-full text-[0.66rem] font-bold inline-flex items-center gap-1 ${
              p.is_ecommerce_active
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-500'
            }`}
            title="E-commerce status"
          >
            <span className="text-[0.62rem]">{p.is_ecommerce_active ? '🌐' : '🔒'}</span>
            <span>{p.is_ecommerce_active ? 'Live' : 'Off'}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleToggleEcommerce(p)}
            className={`py-0.5 px-1.5 rounded-full border-0 text-[0.66rem] font-bold cursor-pointer inline-flex items-center gap-1 transition-all ${
              p.is_ecommerce_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Click to toggle e-commerce visibility"
          >
            <span className="text-[0.62rem]">{p.is_ecommerce_active ? '🌐' : '🔒'}</span>
            <span>{p.is_ecommerce_active ? 'Live' : 'Off'}</span>
          </button>
        )}
      </td>

      {/* 9. Actions (Three-Dot Menu) */}
      <td className="py-1 px-2 text-center align-middle">
        <TableActionDropdown
          triggerLabel="⋮"
          triggerTitle="Actions"
          triggerClassName="border border-slate-300 rounded py-px px-1.5 font-bold text-sm text-slate-600 leading-none"
          items={[
            {
              key: 'view-details',
              label: 'View Details',
              icon: '👁️',
              className: 'text-slate-800 hover:bg-slate-100 font-semibold',
              onClick: () => {
                if (onViewProductDetails) onViewProductDetails(p);
              },
            },
            {
              key: 'create-quotation',
              label: 'Create Quotation',
              icon: '📝',
              className: 'text-indigo-600 hover:bg-indigo-50 font-medium',
              onClick: () => {
                if (onOpenNewQuotation) onOpenNewQuotation(p);
              },
            },
            ...(!isTechnician
              ? [
                  {
                    key: 'new-sale',
                    label: 'New Sale',
                    icon: '🛒',
                    className: 'text-green-800 hover:bg-green-50',
                    onClick: () => {
                      if (onOpenNewSale) onOpenNewSale(p);
                    },
                  },
                  {
                    key: 'print-labels',
                    label: 'Print Labels',
                    icon: '🏷️',
                    onClick: () => handleOpenLabelModal(p),
                  },
                  {
                    key: 'transfer-stock',
                    label: 'Transfer Stock',
                    icon: '🔄',
                    className: 'text-sky-600 hover:bg-sky-50',
                    onClick: () => handleOpenTransferModal(p),
                  },
                ]
              : []),
          ]}
        />
      </td>
    </>
  );
}
