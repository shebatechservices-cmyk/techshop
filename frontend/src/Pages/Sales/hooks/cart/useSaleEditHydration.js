import { useEffect, useRef } from 'react';
import { EXTRA_COST_CATEGORIES } from '../../../Purchases/hooks/usePurchaseCart';
import { money } from '../useSalePricingAndCharges';
import { newTender } from '../useSaleTendersState';
import {
  distributeLegacyDiscounts,
  mapRawSaleItemsToCart,
} from './saleHydrationHelpers';

/**
 * Edit Mode Invoice Hydration Sub-hook
 */
export function useSaleEditHydration({
  isOpen,
  editSale,
  products,
  handlers,
}) {
  const hydratedSaleIdRef = useRef(null);

  const {
    setPaymentConfirmed,
    setPopupMsg,
    setCustomerId,
    setError,
    setItems,
    setDiscount,
    setDiscountTouched,
    setVat,
    setLoyaltyPointsToUse,
    setHasSetupCharge,
    setSetupCharge,
    setSetupRatePerCamera,
    setHasExtraCost,
    setExtraCost,
    setExtraCostCategory,
    setExtraCostNotes,
    setSalesPerson,
    setDestination,
    setAttention,
    setInvoiceDate,
    setTenders,
    setHasUserEditedPaid,
  } = handlers;

  useEffect(() => {
    if (!isOpen) {
      hydratedSaleIdRef.current = null;
      return;
    }

    if (!editSale || !editSale.id) {
      return;
    }

    // Guard: only hydrate once per editSale.id when opening modal
    if (hydratedSaleIdRef.current === editSale.id) {
      return;
    }
    hydratedSaleIdRef.current = editSale.id;

    setPaymentConfirmed(false);
    setPopupMsg('');
    setCustomerId(String(editSale.customer_id || ''));
    setError('');
    const rawSaleItems = editSale.items || [];
    const totalItemDiscount = rawSaleItems.reduce((acc, it) => acc + money(it.discount), 0);
    const loyaltyUsed = Number(editSale.loyalty_points_used || 0);
    const invoiceDiscount = Math.max(0, money(editSale.discount) - loyaltyUsed);

    const distributedLegacyDiscounts =
      totalItemDiscount === 0 && invoiceDiscount > 0
        ? distributeLegacyDiscounts(rawSaleItems, invoiceDiscount)
        : [];

    setItems(mapRawSaleItemsToCart(rawSaleItems, products, distributedLegacyDiscounts));
    setDiscount(money(editSale.discount) - loyaltyUsed);
    setDiscountTouched(false);
    setVat(money(editSale.vat));
      setLoyaltyPointsToUse(loyaltyUsed);
      setHasSetupCharge(money(editSale.setup_charge) > 0);
      setSetupCharge(money(editSale.setup_charge));
      setSetupRatePerCamera(money(editSale.setup_charge));
      setHasExtraCost(money(editSale.extra_cost) > 0);
      setExtraCost(money(editSale.extra_cost));
      setExtraCostCategory(editSale.extra_cost_category || EXTRA_COST_CATEGORIES[0]);
      setExtraCostNotes(editSale.extra_cost_notes || '');
      setSalesPerson(editSale.sales_person || '');
      setDestination(editSale.destination || '');
      setAttention(editSale.attention || '');
      if (editSale.invoice_date) {
        const idate = new Date(editSale.invoice_date);
        if (!isNaN(idate.getTime())) {
          setInvoiceDate(
            `${idate.getFullYear()}-${String(idate.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(idate.getDate()).padStart(2, '0')}`
          );
        }
      }
      const priorTenders = Array.isArray(editSale.payment_details)
        ? typeof editSale.payment_details === 'string'
          ? JSON.parse(editSale.payment_details)
          : editSale.payment_details
        : [];
      const priorPaid = priorTenders.filter((t) => money(t.amount) > 0);
      setTenders(
        priorPaid.length > 0
          ? priorPaid.map((t, idx) => ({
              id: t.id || `edit-sale-tender-${idx}-${Date.now()}`,
              method: t.method || t.payment_mode || 'Cash',
              sub_option: t.sub_option || t.account_name || '',
              transaction_id: t.transaction_id || t.reference_no || '',
              receiver_name: t.receiver_name || '',
              amount: money(t.amount),
              isAccepted: true,
            }))
          : money(editSale.paid_amount) > 0
          ? [newTender(money(editSale.paid_amount), true)]
          : []
      );
      setHasUserEditedPaid(true);
      setPaymentConfirmed(true);
  }, [
    isOpen,
    editSale?.id,
    products,
    setItems,
    setTenders,
    setDiscount,
    setDiscountTouched,
    setVat,
    setLoyaltyPointsToUse,
    setHasSetupCharge,
    setSetupCharge,
    setSetupRatePerCamera,
    setHasExtraCost,
    setExtraCost,
    setExtraCostCategory,
    setExtraCostNotes,
    setHasUserEditedPaid,
    setPaymentConfirmed,
    setCustomerId,
    setError,
    setPopupMsg,
    setSalesPerson,
    setDestination,
    setAttention,
    setInvoiceDate,
  ]);
}

export default useSaleEditHydration;
