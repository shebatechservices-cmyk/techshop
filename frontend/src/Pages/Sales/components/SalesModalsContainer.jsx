import React from 'react';
import NewSaleModal from '../modals/NewSaleModal';
import AddCustomerModal from '../modals/AddCustomerModal';
import SalePrintModal from '../modals/SalePrintModal';
import SaleExchangeModal from '../modals/SaleExchangeModal';
import AdminOverrideModal from '../modals/AdminOverrideModal';
import SaleDetailDrawer from './SaleDetailDrawer';
import DuePaymentModal from '../modals/DuePaymentModal';
import PaymentSlipModal from '../modals/PaymentSlipModal';

export default function SalesModalsContainer({
  salesManager,
  isAddCustomerModalOpen,
  setIsAddCustomerModalOpen,
}) {
  const {
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    modalCustomers,
    products,
    newlyCreatedCustomer,
    handleCustomerCreated,
    handleSaleCreated,
    handleSaleUpdated,
    isPrintOpen,
    setIsPrintOpen,
    printData,
    setPrintData,
    exchangeSaleId,
    setExchangeSaleId,
    loadAllData,
    showToast,
    handleOpenPrintSale,
    overrideModal,
    setOverrideModal,
    handleConfirmOverride,
    taka,
    isSaleDrawerOpen,
    handleCloseSaleDrawer,
    selectedSaleForDrawer,
    isSaleDrawerLoading,
    handleInitiateEditSale,
    handleOpenDuePayment,
    duePaymentModal,
    handleCloseDuePayment,
    handlePaymentSuccess,
    paymentSlipModal,
    handleClosePaymentSlip,
    shopSettings,
  } = salesManager;

  return (
    <>
      {/* 1. New / Edit Sale Modal */}
      {isSaleModalOpen && (
        <NewSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => {
            setIsSaleModalOpen(false);
            setEditingSale(null);
          }}
          customers={modalCustomers}
          products={products}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => setIsAddCustomerModalOpen(true)}
          onCustomerCreated={handleCustomerCreated}
          onSaleCreated={handleSaleCreated}
          editSale={editingSale}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* Embedded / Standalone Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          onCustomerCreated={(newCust) => {
            handleCustomerCreated(newCust);
            setIsAddCustomerModalOpen(false);
          }}
        />
      )}

      {/* 2. Sale / Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={false}
        />
      )}

      {/* 3. Sale Exchange Modal */}
      {exchangeSaleId && (
        <SaleExchangeModal
          isOpen={Boolean(exchangeSaleId)}
          onClose={() => setExchangeSaleId(null)}
          saleId={exchangeSaleId}
          products={products}
          onExchangeComplete={(newExc) => {
            loadAllData();
            showToast(`Exchange completed! Invoice #${newExc.invoice_no || newExc.id}`);
            if (newExc) {
              handleOpenPrintSale(newExc.id || newExc);
            }
          }}
        />
      )}

      {/* 4. Admin Security PIN Override Modal */}
      <AdminOverrideModal
        overrideModal={overrideModal}
        setOverrideModal={setOverrideModal}
        handleConfirmOverride={handleConfirmOverride}
        taka={taka}
      />

      {/* 5. Quick-View Sale Details Drawer */}
      <SaleDetailDrawer
        isOpen={isSaleDrawerOpen}
        onClose={handleCloseSaleDrawer}
        sale={selectedSaleForDrawer}
        loading={isSaleDrawerLoading}
        onPrint={(s) => handleOpenPrintSale(s)}
        onEdit={(s) => {
          handleCloseSaleDrawer();
          handleInitiateEditSale(s?.id || s, s);
        }}
        onCollectDue={(s) => handleOpenDuePayment(s)}
        taka={taka}
      />

      {/* 6. Due Payment Modal */}
      {duePaymentModal?.isOpen && (
        <DuePaymentModal
          isOpen={duePaymentModal.isOpen}
          onClose={handleCloseDuePayment}
          sale={duePaymentModal.sale}
          customer={duePaymentModal.customer}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 7. Money Receipt / Payment Slip Modal */}
      {paymentSlipModal?.isOpen && (
        <PaymentSlipModal
          isOpen={paymentSlipModal.isOpen}
          onClose={handleClosePaymentSlip}
          receiptData={paymentSlipModal.receiptData}
          shopSettings={shopSettings}
        />
      )}
    </>
  );
}
