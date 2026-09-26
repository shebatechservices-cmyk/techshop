import { useState, useEffect, useMemo } from 'react';
import { EXTRA_COST_CATEGORIES } from '../../Purchases/hooks/usePurchaseCart';

export const money = (val) => Number.parseFloat(val || 0) || 0;

export default function useSalePricingAndCharges({
  items = [],
  customerId = '',
  customers = [],
  customerSummary = null,
}) {
  const [discount, setDiscount] = useState(0);
  const [discountTouched, setDiscountTouched] = useState(false);
  const [vat, setVat] = useState(0);
  const [hasSetupCharge, setHasSetupCharge] = useState(false);
  const [cameraCount, setCameraCount] = useState(1);
  const [setupRatePerCamera, setSetupRatePerCamera] = useState(500);
  const [setupCharge, setSetupCharge] = useState(500);
  const [hasExtraCost, setHasExtraCost] = useState(false);
  const [extraCost, setExtraCost] = useState(0);
  const [extraCostCategory, setExtraCostCategory] = useState(EXTRA_COST_CATEGORIES[0]);
  const [extraCostNotes, setExtraCostNotes] = useState('');
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);

  // Auto-detect camera count from cart items
  const detectedCameraCount = useMemo(() => {
    let count = 0;
    for (const it of items) {
      const name = (it.name || '').toLowerCase();
      if (
        name.includes('cam') ||
        name.includes('camera') ||
        name.includes('dome') ||
        name.includes('bullet') ||
        name.includes('cctv')
      ) {
        count += Number(it.quantity || 1);
      }
    }
    return count > 0 ? count : 1;
  }, [items]);

  const handleToggleSetupCharge = (checked) => {
    setHasSetupCharge(checked);
    if (checked) {
      const count = cameraCount > 1 ? cameraCount : detectedCameraCount;
      setCameraCount(count);
      const rate = setupRatePerCamera > 0 ? setupRatePerCamera : 500;
      setSetupRatePerCamera(rate);
      setSetupCharge(count * rate);
    }
  };

  const handleCameraCountChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setCameraCount(num);
    setSetupCharge(num * setupRatePerCamera);
  };

  const handleRateChange = (val) => {
    const rate = Math.max(0, parseFloat(val) || 0);
    setSetupRatePerCamera(rate);
    setSetupCharge(cameraCount * rate);
  };

  const handleDirectSetupChargeChange = (val) => {
    const charge = Math.max(0, parseFloat(val) || 0);
    setSetupCharge(charge);
  };

  // Financial Calculations
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.quantity || 1) * Number(it.unit_price || 0),
    0
  );
  const perItemDiscount = items.reduce((sum, it) => sum + money(it.discount), 0);
  const totalDiscount = money(discount) + money(loyaltyPointsToUse);
  const totalVat = money(vat);
  const totalSetupCharge = hasSetupCharge ? money(setupCharge) : 0;
  const totalExtraCost = hasExtraCost ? money(extraCost) : 0;
  const netAmount = subtotal + totalVat + totalSetupCharge + totalExtraCost;
  const currentSaleTotal = netAmount;

  const payableAmount = Math.max(0, netAmount - totalDiscount);
  const selectedCustomer = (customers || []).find((c) => String(c.id) === String(customerId));
  const previousDue = money(
    customerSummary?.customer?.receivable_balance ??
      selectedCustomer?.receivable_balance ??
      0
  );
  const totalPayable = Math.max(0, payableAmount + previousDue);

  const customerWalletBalance = money(
    customerSummary?.customer?.wallet_balance ??
      customerSummary?.wallet?.balance ??
      selectedCustomer?.wallet_balance ??
      (previousDue < 0 ? Math.abs(previousDue) : 0)
  );
  const customerWalletLabel = selectedCustomer?.name
    ? `Customer Wallet (${selectedCustomer.name})`
    : 'Customer Wallet';

  const customerTypeRaw = String(
    selectedCustomer?.customer_type || selectedCustomer?.customer_group || 'Regular'
  );
  const isTechnician = customerTypeRaw.toLowerCase().includes('tech');
  const isReseller =
    customerTypeRaw.toLowerCase().includes('resell') ||
    customerTypeRaw.toLowerCase().includes('wholesale') ||
    customerTypeRaw.toLowerCase().includes('corporate');
  const isGroupCustomer = isTechnician || isReseller;
  const groupDiscountAmount = isGroupCustomer ? Math.round(subtotal * 0.05) : 0;
  const isGroupDiscountActive =
    isGroupCustomer &&
    Number(discount) === groupDiscountAmount &&
    groupDiscountAmount > 0;

  useEffect(() => {
    if (!discountTouched) {
      setDiscount(
        isGroupCustomer && subtotal > 0 ? groupDiscountAmount : perItemDiscount
      );
    }
  }, [
    discountTouched,
    groupDiscountAmount,
    isGroupCustomer,
    perItemDiscount,
    subtotal,
  ]);

  const handleToggleGroupDiscount = () => {
    setDiscountTouched(true);
    if (isGroupDiscountActive) {
      setDiscount(0);
    } else {
      setDiscount(groupDiscountAmount);
    }
  };

  return {
    discount,
    setDiscount,
    discountTouched,
    setDiscountTouched,
    vat,
    setVat,
    hasSetupCharge,
    setHasSetupCharge,
    cameraCount,
    setCameraCount,
    setupRatePerCamera,
    setSetupRatePerCamera,
    setupCharge,
    setSetupCharge,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    loyaltyPointsToUse,
    setLoyaltyPointsToUse,

    detectedCameraCount,
    subtotal,
    perItemDiscount,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    netAmount,
    currentSaleTotal,
    payableAmount,
    selectedCustomer,
    previousDue,
    totalPayable,
    customerWalletBalance,
    customerWalletLabel,
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,

    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
  };
}
