import React, { useState, useEffect } from 'react';
import useMobileActions from './useMobileActions';
import MobileBottomActionDrawer from './MobileBottomActionDrawer';
import MobileQuickPosModal from './modals/MobileQuickPosModal';
import MobileQuickDueModal from './modals/MobileQuickDueModal';
import MobileStockLookupModal from './modals/MobileStockLookupModal';
import MobileCameraScannerModal from './modals/MobileCameraScannerModal';
import SalePrintModal from '../../Pages/Sales/modals/SalePrintModal';

export default function MobileExperienceContainer({
  currentUser,
  shopInfo,
  onOpenPurchase,
  onOpenRegister,
  onNavigate,
  mobileActions: propMobileActions,
}) {
  const internalMobileActions = useMobileActions();
  const mobileActions = propMobileActions || internalMobileActions;
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    activeModal,
    setActiveModal,
    viewMode,
    toggleViewMode,
    closeModal,
  } = mobileActions;

  const [quickPrintSale, setQuickPrintSale] = useState(null);

  useEffect(() => {
    const handlePreviewSaleEvent = (e) => {
      if (e.detail) setQuickPrintSale(e.detail);
    };
    window.addEventListener('mobile:preview_sale', handlePreviewSaleEvent);
    return () => window.removeEventListener('mobile:preview_sale', handlePreviewSaleEvent);
  }, []);

  const handleSelectAction = (actionId) => {
    setIsDrawerOpen(false);
    if (actionId === 'pos') {
      setActiveModal('pos');
    } else if (actionId === 'due') {
      setActiveModal('due');
    } else if (actionId === 'stock') {
      setActiveModal('stock');
    } else if (actionId === 'scanner') {
      setActiveModal('scanner');
    } else if (actionId === 'expense') {
      if (typeof onNavigate === 'function') onNavigate({ section: 'expenses' });
    } else if (actionId === 'register') {
      if (typeof onOpenRegister === 'function') onOpenRegister();
    } else if (actionId === 'purchase') {
      if (typeof onOpenPurchase === 'function') onOpenPurchase();
    }
  };

  return (
    <>
      {/* Bottom Action Sheet Hub */}
      <MobileBottomActionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectAction={handleSelectAction}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
      />

      {/* 1. Mobile Quick POS Modal */}
      <MobileQuickPosModal
        isOpen={activeModal === 'pos'}
        onClose={closeModal}
        onSaleCompleted={(sale) => {
          setQuickPrintSale(sale);
          window.dispatchEvent(new CustomEvent('sale_created', { detail: sale }));
        }}
      />

      {/* 2. Mobile Quick Due Collection Modal */}
      <MobileQuickDueModal
        isOpen={activeModal === 'due'}
        onClose={closeModal}
        onSuccess={(data) => {
          window.dispatchEvent(new CustomEvent('due_collection_success', { detail: data }));
        }}
      />

      {/* 3. Mobile Stock & Price Lookup Modal */}
      <MobileStockLookupModal
        isOpen={activeModal === 'stock'}
        onClose={closeModal}
        currentUser={currentUser}
      />

      {/* 4. Standalone Camera Scanner Modal */}
      <MobileCameraScannerModal
        isOpen={activeModal === 'scanner'}
        onClose={closeModal}
        onScan={(code) => {
          setActiveModal('stock');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('barcode_scanned', { detail: code }));
          }, 100);
        }}
        title="বারকোড স্ক্যানার"
      />

      {/* 5. Mobile Thermal Receipt Print Preview */}
      {quickPrintSale && (
        <SalePrintModal
          isOpen={Boolean(quickPrintSale)}
          onClose={() => setQuickPrintSale(null)}
          sale={quickPrintSale}
          storeSettings={shopInfo}
          isQuotation={false}
        />
      )}
    </>
  );
}
