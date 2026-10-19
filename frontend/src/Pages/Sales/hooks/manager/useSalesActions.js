import { useSaleDrawerAndPrint } from './actions/useSaleDrawerAndPrint';
import { useSaleEditAndDelete } from './actions/useSaleEditAndDelete';
import { useSaleDuePayments } from './actions/useSaleDuePayments';

export function useSalesActions({
  loadAllData,
  showToast,
  isAdmin,
  getSaleLockStatus,
  setOverrideModal,
  setActiveTab,
  setCustomersCount,
  setModalCustomers,
}) {
  const drawerAndPrint = useSaleDrawerAndPrint({ showToast });

  const editAndDelete = useSaleEditAndDelete({
    loadAllData,
    showToast,
    isAdmin,
    getSaleLockStatus,
    setOverrideModal,
    setActiveTab,
    setCustomersCount,
    setModalCustomers,
    handleOpenPrintSale: drawerAndPrint.handleOpenPrintSale,
    setActionLoading: drawerAndPrint.setActionLoading,
  });

  const duePayments = useSaleDuePayments({
    loadAllData,
    selectedSaleForDrawer: drawerAndPrint.selectedSaleForDrawer,
    handleOpenSaleDrawer: drawerAndPrint.handleOpenSaleDrawer,
    showToast,
  });

  return {
    ...drawerAndPrint,
    ...editAndDelete,
    ...duePayments,
  };
}
