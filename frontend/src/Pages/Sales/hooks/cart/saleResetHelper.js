import { newTender } from '../useSaleTendersState';

export function resetSaleForm(handlers) {
  const {
    setCustomerId,
    setCustomerSummary,
    setItems,
    setDiscount,
    setDiscountTouched,
    setVat,
    setHasSetupCharge,
    setSetupCharge,
    setHasExtraCost,
    setExtraCost,
    setExtraCostNotes,
    setLoyaltyPointsToUse,
    setDestination,
    setAttention,
    setSearchQuery,
    setBarcodeInput,
    setError,
    setPopupMsg,
    setTenders,
    setHasUserEditedPaid,
    setPaymentConfirmed,
  } = handlers;

  setCustomerId('');
  setCustomerSummary(null);
  setItems([]);
  setDiscount(0);
  setDiscountTouched(false);
  setVat(0);
  setHasSetupCharge(false);
  setSetupCharge(500);
  setHasExtraCost(false);
  setExtraCost(0);
  setExtraCostNotes('');
  setLoyaltyPointsToUse(0);
  setDestination('');
  setAttention('');
  setSearchQuery('');
  setBarcodeInput('');
  setError('');
  setPopupMsg('');
  setTenders([newTender(0, false)]);
  setHasUserEditedPaid(false);
  setPaymentConfirmed(false);
}
