import { useEffect } from 'react';
import { EXTRA_COST_CATEGORIES } from '../../../Purchases/hooks/usePurchaseCart';
import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../../utils/productUtils';
import { money } from '../useSalePricingAndCharges';
import { newTender } from '../useSaleTendersState';

/**
 * Edit Mode Invoice Hydration Sub-hook
 */
export function useSaleEditHydration({
  isOpen,
  editSale,
  products,
  handlers,
}) {
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
    if (isOpen && editSale && editSale.id) {
      setPaymentConfirmed(false);
      setPopupMsg('');
      setCustomerId(String(editSale.customer_id || ''));
      setError('');
      setItems(
        (editSale.items || []).map((it, idx) => {
          const prodInList = (products || []).find((p) => p.id === it.product_id);
          const fullName = fullCatalogName(prodInList || it);
          const isTracked =
            isProductSerialTracked(prodInList) || isProductSerialTracked(it);
          const isWarrantyReq =
            isProductWarrantyRequired(prodInList) ||
            isProductWarrantyRequired(it);
          const serialsList = Array.isArray(it.serials) ? it.serials : [];
          return {
            localId: `${Date.now()}-${idx}`,
            product_id: it.product_id,
            name: fullName,
            full_name: fullName,
            brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
            stock: prodInList ? Number(prodInList.stock || 0) : 0,
            quantity: isTracked ? serialsList.length : Number(it.quantity || 1),
            unit_price: money(it.unit_price),
            cost_price: money(it.cost_price),
            discount: money(it.discount),
            warranty_months:
              it.warranty_months !== undefined && it.warranty_months !== null
                ? Number(it.warranty_months)
                : prodInList
                ? Number(prodInList.warranty_months || 0)
                : 0,
            serials: serialsList,
            is_serial_tracked: isTracked,
            is_warranty_required: isWarrantyReq,
            unit_type: it.unit_type || 'base_unit',
            unit_name: it.unit_name || prodInList?.unit_name || 'Pcs',
            base_unit_name: prodInList?.unit_name || 'Pcs',
            sub_unit_name: prodInList?.sub_unit_name || null,
            conversion_rate: Number(prodInList?.conversion_rate || it.conversion_rate || 1),
            sub_unit_selling_price: prodInList?.sub_unit_selling_price ? Number(prodInList.sub_unit_selling_price) : null,
            sub_unit_barcode: prodInList?.sub_unit_barcode || null,
            base_unit_price: prodInList ? Number(prodInList.selling_price || prodInList.sale_price || it.unit_price) : Number(it.unit_price),
            base_unit_cost: prodInList ? Number(prodInList.purchase_price || it.cost_price) : Number(it.cost_price),
          };
        })
      );
      const loyaltyUsed = Number(editSale.loyalty_points_used || 0);
      setDiscount(money(editSale.discount) - loyaltyUsed);
      setDiscountTouched(true);
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
    }
  }, [
    isOpen,
    editSale,
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
