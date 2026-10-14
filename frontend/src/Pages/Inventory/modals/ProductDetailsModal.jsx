import React, { useState } from 'react';
import ProductDetailsHeader from './product-details/ProductDetailsHeader';
import ProductDetailsBanner from './product-details/ProductDetailsBanner';
import ProductDetailsMetrics from './product-details/ProductDetailsMetrics';
import ProductDetailsPricing from './product-details/ProductDetailsPricing';
import ProductDetailsWarranty from './product-details/ProductDetailsWarranty';
import ProductDetailsFooter from './product-details/ProductDetailsFooter';

export default function ProductDetailsModal({
  product,
  onClose,
  onOpenNewSale,
  onOpenNewQuotation,
  handleOpenTransferModal,
  handleOpenLabelModal,
  handleOpenWarrantyModal,
  taka = '৳',
  getWarrantyValidity,
  isTechnician = false,
}) {
  const [showCost, setShowCost] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  if (!product) return null;

  const stock = Number(product.stock || 0);
  const minStock = Number(product.min_stock || 5);
  const isOut = stock <= 0;
  const isLow = stock <= minStock && !isOut;

  const costPrice = Number(product.cost_price || product.purchase_price || 0);
  const salePrice = Number(product.sale_price || product.selling_price || product.mrp || 0);
  const mrp = Number(product.mrp || 0);
  const convRate = Number(product.conversion_rate || 1) > 1 ? Number(product.conversion_rate) : 1;
  const effectiveCost = convRate > 1 ? (costPrice / convRate) : costPrice;
  const effectiveSale = convRate > 1 ? (salePrice / convRate) : salePrice;
  const margin = salePrice > 0 && costPrice > 0 ? salePrice - costPrice : 0;
  const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(1) : 0;
  const totalValuation = stock * effectiveCost;

  // Supplier warranty calculation
  const supMonths = Number(product.supplier_warranty_months || product.warranty_months || 0);
  let expDateStr = product.supplier_warranty_expire_date;
  if (!expDateStr && product.purchase_date && supMonths > 0) {
    const pd = new Date(product.purchase_date);
    if (!isNaN(pd.getTime())) {
      const exp = new Date(pd);
      exp.setMonth(exp.getMonth() + supMonths);
      expDateStr = exp.toISOString().split('T')[0];
    }
  }
  const validity = expDateStr && getWarrantyValidity ? getWarrantyValidity(expDateStr) : null;
  const agingDays = Number(product.aging_days || 0);

  const formatMoney = (val) => {
    if (typeof taka === 'function') {
      return taka(val);
    }
    const symbol = typeof taka === 'string' ? taka : '৳';
    return `${symbol}${Number(val || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[99999] p-4 sm:p-6 backdrop-blur-[3px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[760px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn my-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header */}
        <ProductDetailsHeader product={product} onClose={onClose} />

        {/* 2. Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Top Banner: Image + Quick Badges + SKU */}
          <ProductDetailsBanner
            product={product}
            isOut={isOut}
            isLow={isLow}
            stock={stock}
            handleCopy={handleCopy}
            copiedKey={copiedKey}
          />

          {/* 3. Metrics Summary (Stock, Inflow, Sold, Aging) */}
          <ProductDetailsMetrics
            product={product}
            stock={stock}
            minStock={minStock}
            agingDays={agingDays}
          />

          {/* 4. Pricing, Cost & Valuation Card + Batches */}
          <ProductDetailsPricing
            product={product}
            isTechnician={isTechnician}
            showCost={showCost}
            setShowCost={setShowCost}
            salePrice={salePrice}
            costPrice={costPrice}
            effectiveSale={effectiveSale}
            effectiveCost={effectiveCost}
            margin={margin}
            marginPercent={marginPercent}
            totalValuation={totalValuation}
            mrp={mrp}
            convRate={convRate}
            formatMoney={formatMoney}
          />

          {/* 5. Supplier Warranty Information & Description */}
          <ProductDetailsWarranty
            product={product}
            supMonths={supMonths}
            expDateStr={expDateStr}
            validity={validity}
            handleOpenWarrantyModal={handleOpenWarrantyModal}
            onClose={onClose}
          />
        </div>

        {/* 6. Modal Actions Footer */}
        <ProductDetailsFooter
          product={product}
          isTechnician={isTechnician}
          isOut={isOut}
          onClose={onClose}
          onOpenNewQuotation={onOpenNewQuotation}
          onOpenNewSale={onOpenNewSale}
          handleOpenTransferModal={handleOpenTransferModal}
          handleOpenLabelModal={handleOpenLabelModal}
          handleOpenWarrantyModal={handleOpenWarrantyModal}
        />
      </div>
    </div>
  );
}
