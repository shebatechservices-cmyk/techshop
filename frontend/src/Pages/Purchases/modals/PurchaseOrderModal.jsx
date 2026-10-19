import React from 'react';
import PurchaseSupplierSidebar from '../components/PurchaseSupplierSidebar';
import PurchaseOrderHeader from '../components/PurchaseOrderHeader';
import { usePurchaseCart } from '../hooks/usePurchaseCart';
import PurchaseOrderFormBody from './purchase-order/PurchaseOrderFormBody';
import PurchaseOrderSubModals from './purchase-order/PurchaseOrderSubModals';

export default function PurchaseOrderModal(props) {
  const {
    isOpen = true,
    orderToEdit = null,
    onClose = () => {},
  } = props;

  const cart = usePurchaseCart(props);
  const {
    items,
    selectedSupplierObj,
    supplierPayable,
    summary,
    handleOpenRecentPreview,
    searchContainerRef,
    supplierSelectRef,
    setIsSearchOpen,
    setIsSupplierOpen,
  } = cart;

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef?.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (supplierSelectRef?.current && !supplierSelectRef.current.contains(e.target)) {
        setIsSupplierOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [searchContainerRef, supplierSelectRef, setIsSearchOpen, setIsSupplierOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-[95vw] max-w-[1100px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden overflow-x-hidden border border-slate-200">
          {/* Header */}
          <PurchaseOrderHeader
            orderToEdit={orderToEdit}
            items={items}
            selectedSupplierObj={selectedSupplierObj}
            onClose={onClose}
          />

          {/* Modal Body - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] flex-1 overflow-y-auto py-5 px-6 gap-6">
            {/* Left Column: Supplier Profile Card & Recent Purchases */}
            <PurchaseSupplierSidebar
              selectedSupplierObj={selectedSupplierObj}
              supplierPayable={supplierPayable}
              summary={summary}
              handleOpenRecentPreview={handleOpenRecentPreview}
            />

            {/* Right Column: Main Form */}
            <PurchaseOrderFormBody cart={cart} props={props} />
          </div>
        </div>
      </div>

      {/* Sub-modals & Popups */}
      <PurchaseOrderSubModals cart={cart} onClose={onClose} />
    </>
  );
}
