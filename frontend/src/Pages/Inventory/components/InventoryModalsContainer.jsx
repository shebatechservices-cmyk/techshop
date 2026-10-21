import React from 'react';
import WarehouseManageModal from '../modals/WarehouseManageModal';
import WarrantyModal from '../modals/WarrantyModal';
import LabelPrintModal from '../modals/LabelPrintModal';
import StockTransferModal from '../modals/StockTransferModal';
import ProductDetailsModal from '../modals/ProductDetailsModal';
import SaleQuotationModal from '../../Sales/modals/SaleQuotationModal';

export default function InventoryModalsContainer({
  detailModalProduct,
  handleCloseProductDetails,
  onOpenNewSale,
  handleOpenQuotation,
  handleOpenTransferModal,
  handleOpenLabelModal,
  handleOpenWarrantyModal,
  taka,
  getWarrantyValidity,
  isTechnician,
  warrantyModalProduct,
  warrantyData,
  setWarrantyModalProduct,
  labelModalProduct,
  labelQuantity,
  setLabelQuantity,
  handlePrintLabels,
  setLabelModalProduct,
  printLabelRef,
  isTransferModalOpen,
  setIsTransferModalOpen,
  products,
  warehouses,
  transferForm,
  setTransferForm,
  handleExecuteTransfer,
  transferSubmitting,
  isWarehouseModalOpen,
  setIsWarehouseModalOpen,
  selectedWarehouseId,
  setSelectedWarehouseId,
  loadInventory,
  isQuotationModalOpen,
  setIsQuotationModalOpen,
  quotationProduct,
  setQuotationProduct,
}) {
  return (
    <>
      {/* Modal 1: Product Detailed View Modal */}
      <ProductDetailsModal
        product={detailModalProduct}
        onClose={handleCloseProductDetails}
        onOpenNewSale={onOpenNewSale}
        onOpenNewQuotation={handleOpenQuotation}
        handleOpenTransferModal={handleOpenTransferModal}
        handleOpenLabelModal={handleOpenLabelModal}
        handleOpenWarrantyModal={handleOpenWarrantyModal}
        taka={taka}
        getWarrantyValidity={getWarrantyValidity}
        isTechnician={isTechnician}
      />

      {/* Modal 2: Warranty & Serial Numbers */}
      <WarrantyModal
        product={warrantyModalProduct}
        warrantyData={warrantyData}
        onClose={() => setWarrantyModalProduct(null)}
      />

      {/* Modal 3: Print Barcode & Price Labels */}
      <LabelPrintModal
        product={labelModalProduct}
        labelQuantity={labelQuantity}
        setLabelQuantity={setLabelQuantity}
        onPrint={handlePrintLabels}
        onClose={() => setLabelModalProduct(null)}
        printLabelRef={printLabelRef}
      />

      {/* Modal 4: Stock Transfer */}
      {!isTechnician && (
        <StockTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          products={products}
          warehouses={warehouses}
          transferForm={transferForm}
          setTransferForm={setTransferForm}
          onSubmit={handleExecuteTransfer}
          transferSubmitting={transferSubmitting}
        />
      )}

      {/* Modal 5: Centralized Warehouse Management Modal */}
      {!isTechnician && (
        <WarehouseManageModal
          isOpen={isWarehouseModalOpen}
          onClose={() => setIsWarehouseModalOpen(false)}
          onWarehouseUpdated={(updatedList) => {
            if (updatedList && !updatedList.some((w) => w.id === selectedWarehouseId && w.is_active)) {
              const def = updatedList.find((w) => w.is_default && w.is_active) || updatedList[0];
              if (def) setSelectedWarehouseId(def.id);
            }
            loadInventory();
          }}
        />
      )}

      {/* Modal 6: Sales Quotation Creation Modal */}
      <SaleQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setQuotationProduct(null);
        }}
        products={products}
        initialProduct={quotationProduct}
      />
    </>
  );
}
