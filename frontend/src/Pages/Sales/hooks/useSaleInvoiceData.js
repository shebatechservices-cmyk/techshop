import { useMemo } from 'react';
import { fullCatalogName } from '../../../utils/productUtils';

export default function useSaleInvoiceData({
  invoice,
  customer: propCustomer,
  storeSettings: propSettings,
  company: propCompany,
  fetchedSettings = {},
  isQuotation = false,
  mode = 'invoice',
}) {
  return useMemo(() => {
    if (!invoice) return null;

    const isChalan = !isQuotation && mode === 'chalan';

    // 1. Dynamic Store Settings (Merged from propSettings, fetchedSettings, and propCompany)
    const store = { ...fetchedSettings, ...propCompany, ...propSettings };
    const storeName = store.business_name || store.shop_name || store.name || 'SHEBA TECHNOLOGY BD';
    const storeSubtitle = store.sub_title || store.shop_title || store.sister_concern_name || store.tagline || '';
    const storeAddress = store.address || '';
    const storePhones = store.phone_numbers || [store.phone, store.alt_phone, store.hotline].filter(Boolean).join(', ') || '';
    const storeEmail = store.email || '';
    const storeWebsite = store.website || store.web || '';
    const storeLogo = store.logo_url || store.logo || '';
    const storeSecondaryLogo = store.secondary_logo_url || store.partner_logo_url || '';
    const storeWatermarkLogo = store.watermark_logo_url || store.watermark_url || storeLogo;
    const returnPolicyText = store.return_policy_text || store.return_refund_policy || store.invoice_terms || '';
    const warrantyDisclaimerText = store.warranty_disclaimer_text || store.warranty_policy || 'Warranty Void — The Warranty Is Not Applicable To Adaptor, Remote, Burnt Items.';
    const invoiceFooterNote = store.invoice_footer_note || '';
    const showLogo = store.show_logo_on_invoice !== false;

    // Advanced Print Layout Settings from Store
    const paperSize = store.paper_size || (store.default_invoice_format === 'thermal_80mm' ? 'thermal_80mm' : (store.default_invoice_format === 'a5_invoice' ? 'a5' : 'a4'));
    const pageMargin = store.page_margin || 'default';
    const showFooterDetails = store.show_footer_details !== false;
    const pageSizeRule = paperSize === 'a5' ? 'A5 portrait' : (paperSize === 'thermal_80mm' ? '80mm auto' : 'A4 portrait');

    // Dynamic Partner Logos Array
    const partnerLogos = Array.isArray(store.footer_partner_logos)
      ? store.footer_partner_logos
      : (Array.isArray(store.invoice_brand_logos) ? store.invoice_brand_logos : []);

    // 2. Dynamic Customer Info
    const cust = propCustomer || invoice.customer || {};
    const customerName = cust.name || invoice.customer_name || invoice.client_name || 'Walk-in Customer';
    const customerPhone = cust.phone || cust.mobile || invoice.customer_phone || invoice.client_phone || '';
    const customerAddress = cust.address || invoice.customer_address || invoice.client_address || '';
    const customerEmail = cust.email || invoice.customer_email || invoice.client_email || '';
    const customerAttention = invoice.attention || cust.attention || '';
    const customerDestination = invoice.destination || cust.destination || '';

    // 3. Dynamic Invoice Metadata
    const docNumber = isQuotation
      ? (invoice.quotation_no || invoice.quotation_number || `QTN-${invoice.id || 'DRAFT'}`)
      : (invoice.invoice_no || invoice.invoice_number || `INV-${invoice.id || 'DRAFT'}`);

    const rawDate = invoice.created_at || invoice.date || new Date();
    const dateObj = new Date(rawDate);
    const isValidDate = !isNaN(dateObj.getTime());
    const dateFormatted = isValidDate
      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : (invoice.date || '');
    const timeFormatted = isValidDate
      ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : (invoice.time || '');

    let operatorName = '';
    try {
      const authData = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      if (authData) {
        const parsed = JSON.parse(authData);
        operatorName = parsed.name || parsed.username || '';
      }
    } catch {}

    const preparedBy = invoice.prepared_by || invoice.created_by_name || invoice.created_by || operatorName || 'Sheba Tech Admin';
    const salesPerson = invoice.sales_person || invoice.sales_person_name || preparedBy;

    // 4. Dynamic Items Array Mapping
    const rawItems = invoice.items || invoice.sales_items || [];
    const items = rawItems.map((it) => {
      const unitPrice = parseFloat(it.unit_price ?? it.price ?? it.rate ?? it.selling_price ?? 0);
      const qty = parseFloat(it.quantity ?? it.qty ?? 1);
      const amount = parseFloat(it.total_price ?? it.total ?? (unitPrice * qty));
      const uom = it.uom || it.unit || 'Pcs';
      const warranty = it.warranty_months
        ? `${it.warranty_months} M`
        : (it.warranty || (it.warranty_text ? it.warranty_text : ''));

      let serials = [];
      if (Array.isArray(it.serials) && it.serials.length > 0) {
        serials = it.serials.map((s) => (typeof s === 'string' ? s : s.serial_code)).filter(Boolean);
      } else if (it.serial_numbers) {
        serials = Array.isArray(it.serial_numbers) ? it.serial_numbers : [it.serial_numbers];
      } else if (it.serial_no) {
        serials = [it.serial_no];
      }

      const fullName = fullCatalogName(it);
      return {
        name: fullName,
        uom,
        warranty,
        qty,
        unitPrice,
        amount,
        serials,
      };
    });

    // 5. Financial Totals Calculations
    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    const subtotal = parseFloat(invoice.subtotal ?? invoice.gross_amount ?? (items.reduce((s, it) => s + it.amount, 0)));
    const discount = parseFloat(invoice.discount ?? invoice.discount_amount ?? 0);
    const vat = parseFloat(invoice.vat ?? invoice.vat_amount ?? invoice.tax ?? 0);
    const setupCharge = parseFloat(invoice.setup_charge ?? 0);
    const extraCost = parseFloat(invoice.extra_cost ?? 0);
    const extraCostCategory = invoice.extra_cost_category || '';
    const extraCostNotes = invoice.extra_cost_notes || '';
    const netPayable = parseFloat(invoice.total_amount ?? invoice.net_total ?? (subtotal - discount + vat + setupCharge + extraCost));
    const previousDue = parseFloat(invoice.previous_due ?? 0);
    const totalDueAmount = netPayable + previousDue;
    const paidAmount = parseFloat(invoice.paid_amount ?? invoice.total_paid ?? 0);
    const dueAmount = parseFloat(invoice.due_amount ?? (totalDueAmount - paidAmount));
    const isFullyPaid = dueAmount <= 0.01;
    const isPartialPaid = paidAmount > 0 && !isFullyPaid;
    const paymentStatus = isQuotation ? 'QUOTATION' : (isFullyPaid ? 'PAID' : (isPartialPaid ? 'PARTIAL' : 'DUE'));
    const narration = invoice.note || invoice.narration || invoice.remarks || '';

    const paymentTenders = Array.isArray(invoice.payments) ? invoice.payments : (
      Array.isArray(invoice.payment_tenders) ? invoice.payment_tenders : []
    );

    const isThermal = paperSize === 'thermal_80mm';

    return {
      store,
      storeName,
      storeSubtitle,
      storeAddress,
      storePhones,
      storeEmail,
      storeWebsite,
      storeLogo,
      storeSecondaryLogo,
      storeWatermarkLogo,
      returnPolicyText,
      warrantyDisclaimerText,
      invoiceFooterNote,
      showLogo,
      showFooterDetails,
      paperSize,
      pageMargin,
      pageSizeRule,
      partnerLogos,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      customerAttention,
      customerDestination,
      docNumber,
      dateFormatted,
      timeFormatted,
      preparedBy,
      salesPerson,
      items,
      totalQuantity,
      subtotal,
      discount,
      vat,
      setupCharge,
      extraCost,
      extraCostCategory,
      extraCostNotes,
      netPayable,
      previousDue,
      totalDueAmount,
      paidAmount,
      dueAmount,
      isFullyPaid,
      isPartialPaid,
      paymentStatus,
      narration,
      paymentTenders,
      isThermal,
      isChalan,
    };
  }, [invoice, propCustomer, propSettings, propCompany, fetchedSettings, isQuotation, mode]);
}
