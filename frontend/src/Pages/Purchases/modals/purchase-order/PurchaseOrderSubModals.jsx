import React from 'react';
import PurchasePrintModal from '../PurchasePrintModal';
import PurchaseLedgerPreviewModal from '../PurchaseLedgerPreviewModal';
import PurchaseComprehensiveProductModal from '../PurchaseComprehensiveProductModal';
import AddSupplierModal from '../AddSupplierModal';

export default function PurchaseOrderSubModals({ cart, onClose }) {
  const {
    isAddSupplierOpen,
    setIsAddSupplierOpen,
    setSuppliers,
    setSupplierId,
    setSupplierSearch,
    setIsSupplierOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    query,
    setProductList,
    addProduct,
    setQuery,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    previewOrderId,
    previewOrderData,
    handleLoadOrderInForm,
    setPrintOrder,
    setIsPrintPreviewOnly,
    setIsPrintOpen,
    isPrintOpen,
    printOrder,
    selectedSupplierObj,
    isPrintPreviewOnly,
    popupMsg,
    setPopupMsg,
  } = cart;

  return (
    <>
      {/* Inline Quick Add Supplier Modal */}
      {isAddSupplierOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierOpen}
          onClose={() => setIsAddSupplierOpen(false)}
          onSupplierCreated={(newSup) => {
            if (newSup && newSup.id) {
              setSuppliers((prev) => [newSup, ...prev.filter((s) => s.id !== newSup.id)]);
              setSupplierId(String(newSup.id));
              setSupplierSearch('');
              setIsSupplierOpen(false);
            }
            setIsAddSupplierOpen(false);
          }}
          onSupplierAdded={(newSup) => {
            if (newSup && newSup.id) {
              setSuppliers((prev) => [newSup, ...prev.filter((s) => s.id !== newSup.id)]);
              setSupplierId(String(newSup.id));
              setSupplierSearch('');
              setIsSupplierOpen(false);
            }
            setIsAddSupplierOpen(false);
          }}
        />
      )}

      {/* Inline Comprehensive Add Product to Catalog Modal */}
      {isAddProductOpen && (
        <PurchaseComprehensiveProductModal
          isOpen={isAddProductOpen}
          initialName={query?.trim() || ''}
          onClose={() => setIsAddProductOpen(false)}
          onProductCreated={(createdProd) => {
            if (createdProd && createdProd.id) {
              setProductList((prev) => [createdProd, ...prev]);
              addProduct(createdProd);
              if (setQuery) setQuery('');
            }
            setIsAddProductOpen(false);
          }}
        />
      )}

      {/* Recent PO Ledger Preview Modal with Voucher view, Open in Purchase Form, Print, and Share */}
      {isLedgerPreviewOpen && (
        <PurchaseLedgerPreviewModal
          isOpen={isLedgerPreviewOpen}
          onClose={() => setIsLedgerPreviewOpen(false)}
          orderId={previewOrderId}
          purchaseOrderId={previewOrderId}
          initialOrder={previewOrderData}
          purchaseOrderData={previewOrderData}
          onOpenInPurchaseForm={(po) => handleLoadOrderInForm(po)}
          onLoadInForm={(po) => handleLoadOrderInForm(po)}
          onOpenPrint={(po) => {
            setPrintOrder(po);
            setIsPrintPreviewOnly(true);
            setIsPrintOpen(true);
            setIsLedgerPreviewOpen(false);
          }}
        />
      )}

      {/* Print / Voucher Modal */}
      {isPrintOpen && (
        <PurchasePrintModal
          isOpen={isPrintOpen}
          order={printOrder}
          supplier={selectedSupplierObj}
          onClose={() => {
            setIsPrintOpen(false);
            if (!isPrintPreviewOnly) {
              onClose();
            }
          }}
        />
      )}

      {/* Save-block popup (supplier / payment) */}
      {popupMsg && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setPopupMsg('')}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-1.5">⚠️</div>
            <div className="font-extrabold text-base text-slate-900 mb-1.5">
              Unable to Save Purchase
            </div>
            <div className="text-sm text-slate-600 mb-4">{popupMsg}</div>
            <button
              type="button"
              onClick={() => setPopupMsg('')}
              className="py-2 px-6 rounded-lg border-0 bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-800 transition-colors"
            >
              OK, Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
