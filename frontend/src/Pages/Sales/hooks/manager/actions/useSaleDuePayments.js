import { useState, useCallback } from 'react';

export function useSaleDuePayments({
  loadAllData,
  selectedSaleForDrawer,
  handleOpenSaleDrawer,
  showToast,
}) {
  const [duePaymentModal, setDuePaymentModal] = useState({
    isOpen: false,
    sale: null,
    customer: null,
  });

  const [paymentSlipModal, setPaymentSlipModal] = useState({
    isOpen: false,
    receiptData: null,
  });

  const handleOpenDuePayment = useCallback((sale, customer = null) => {
    setDuePaymentModal({
      isOpen: true,
      sale: sale || null,
      customer: customer || null,
    });
  }, []);

  const handleCloseDuePayment = useCallback(() => {
    setDuePaymentModal({
      isOpen: false,
      sale: null,
      customer: null,
    });
  }, []);

  const handlePaymentSuccess = useCallback(
    (receiptData) => {
      loadAllData?.();
      if (selectedSaleForDrawer && receiptData?.sale?.id === selectedSaleForDrawer.id) {
        handleOpenSaleDrawer(selectedSaleForDrawer.id);
      }
      setPaymentSlipModal({
        isOpen: true,
        receiptData,
      });
      showToast?.('Payment recorded and receipt generated!');
    },
    [loadAllData, selectedSaleForDrawer, handleOpenSaleDrawer, showToast]
  );

  const handleClosePaymentSlip = useCallback(() => {
    setPaymentSlipModal({
      isOpen: false,
      receiptData: null,
    });
  }, []);

  return {
    duePaymentModal,
    setDuePaymentModal,
    paymentSlipModal,
    setPaymentSlipModal,
    handleOpenDuePayment,
    handleCloseDuePayment,
    handlePaymentSuccess,
    handleClosePaymentSlip,
  };
}
