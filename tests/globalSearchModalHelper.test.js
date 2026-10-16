/**
 * Build 4-dimension modal data (Product, Purchase, Inventory, Sale, Warranty) from a product record
 */
function buildFallbackModalData(targetProd, code = '') {
  if (!targetProd) return null;

  const firstPo = targetProd.purchase_history?.[0] || null;
  const firstSale = targetProd.sales_history?.[0] || null;
  const isUnitSold = targetProd.matched_serial_status === 'Sold' || Boolean(firstSale);
  const unitStatus = targetProd.matched_serial
    ? (isUnitSold ? 'Sold' : 'In Stock')
    : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock');

  const modalData = {
    serial_code: targetProd.matched_serial || null,
    status: unitStatus,
    product: {
      id: targetProd.id,
      name: targetProd.name,
      brand_name: targetProd.brand_name,
      category_name: targetProd.category_name,
      sku: targetProd.sku,
      barcode: targetProd.barcode,
      stock: targetProd.stock,
      cost_price: targetProd.cost_price,
      sale_price: targetProd.sale_price,
    },
    purchase: firstPo ? {
      po_id: firstPo.po_id,
      po_number: firstPo.po_number,
      purchase_date: firstPo.purchase_date,
      cost_price: firstPo.cost_price,
      supplier_name: firstPo.supplier_name,
      supplier_phone: firstPo.supplier_phone,
      supplier_warranty_expire_date: firstPo.supplier_warranty_expire_date,
    } : null,
    inventory: {
      stock: targetProd.stock,
      unit_status: targetProd.matched_serial
        ? (isUnitSold ? 'Sold to Customer' : 'Available in Inventory')
        : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock'),
      cost_price: targetProd.cost_price,
      sale_price: targetProd.sale_price,
    },
    sale: firstSale ? {
      sale_id: firstSale.sale_id,
      invoice_no: firstSale.invoice_no,
      sale_date: firstSale.sale_date,
      customer_name: firstSale.customer_name,
      customer_phone: firstSale.customer_phone,
      unit_price: firstSale.unit_price,
      payment_status: 'paid',
    } : null,
    warranty: {
      warranty_months: targetProd.warranty_months,
      customer_warranty_info: `${targetProd.warranty_months || 12} Months Policy`,
      claims: targetProd.warranty_claims || [],
      returns: targetProd.returns_refunds || [],
    },
  };

  const modalMatchType = targetProd.matched_serial
    ? (isUnitSold ? 'SERIAL_SOLD' : 'SERIAL_INVENTORY')
    : (targetProd.barcode ? 'PRODUCT_BARCODE' : 'PRODUCT_DETAILS');

  const modalScannedCode = code || targetProd.matched_serial || targetProd.barcode || targetProd.sku;

  return { modalData, modalMatchType, modalScannedCode };
}

describe('Global Search Barcode Modal Helper Unit Tests', () => {
  test('returns null if targetProd is null or undefined', () => {
    expect(buildFallbackModalData(null)).toBeNull();
    expect(buildFallbackModalData(undefined)).toBeNull();
  });

  test('synthesizes 4-dimension modal data for in-stock serial item', () => {
    const mockProduct = {
      id: 101,
      name: 'Hikvision 2MP Camera',
      brand_name: 'Hikvision',
      category_name: 'Security',
      sku: 'HIK-2MP-01',
      barcode: '890123456',
      stock: 5,
      cost_price: 2500,
      sale_price: 3200,
      warranty_months: 24,
      matched_serial: 'SN-HIK-101',
      matched_serial_status: 'In Stock',
      purchase_history: [
        {
          po_id: 1,
          po_number: 'PO-2026-001',
          purchase_date: '2026-01-10',
          cost_price: 2500,
          supplier_name: 'Tech Distributor BD',
          supplier_phone: '01711000000',
          supplier_warranty_expire_date: '2028-01-10',
        },
      ],
      sales_history: [],
      warranty_claims: [],
      returns_refunds: [],
    };

    const res = buildFallbackModalData(mockProduct, 'SN-HIK-101');
    expect(res).not.toBeNull();
    expect(res.modalMatchType).toBe('SERIAL_INVENTORY');
    expect(res.modalScannedCode).toBe('SN-HIK-101');
    expect(res.modalData.status).toBe('In Stock');
    expect(res.modalData.product.name).toBe('Hikvision 2MP Camera');
    expect(res.modalData.purchase.po_number).toBe('PO-2026-001');
    expect(res.modalData.sale).toBeNull();
    expect(res.modalData.inventory.stock).toBe(5);
    expect(res.modalData.warranty.warranty_months).toBe(24);
  });

  test('synthesizes 4-dimension modal data for sold serial item', () => {
    const mockProduct = {
      id: 102,
      name: 'TP-Link Router',
      brand_name: 'TP-Link',
      category_name: 'Networking',
      sku: 'TPL-WR840N',
      barcode: '77889900',
      stock: 0,
      cost_price: 1200,
      sale_price: 1650,
      warranty_months: 12,
      matched_serial: 'SN-TPL-999',
      matched_serial_status: 'Sold',
      purchase_history: [],
      sales_history: [
        {
          sale_id: 88,
          invoice_no: 'INV-2026-088',
          sale_date: '2026-03-15',
          customer_name: 'John Doe',
          customer_phone: '01811223344',
          unit_price: 1650,
        },
      ],
    };

    const res = buildFallbackModalData(mockProduct, 'SN-TPL-999');
    expect(res).not.toBeNull();
    expect(res.modalMatchType).toBe('SERIAL_SOLD');
    expect(res.modalScannedCode).toBe('SN-TPL-999');
    expect(res.modalData.status).toBe('Sold');
    expect(res.modalData.sale.invoice_no).toBe('INV-2026-088');
    expect(res.modalData.sale.customer_name).toBe('John Doe');
  });

  test('synthesizes product barcode when matched_serial is not present', () => {
    const mockProduct = {
      id: 103,
      name: 'Cat6 Cable 305m',
      brand_name: 'D-Link',
      sku: 'DL-CAT6-305',
      barcode: '6901234567890',
      stock: 12,
      cost_price: 6500,
      sale_price: 8500,
    };

    const res = buildFallbackModalData(mockProduct, '6901234567890');
    expect(res).not.toBeNull();
    expect(res.modalMatchType).toBe('PRODUCT_BARCODE');
    expect(res.modalScannedCode).toBe('6901234567890');
    expect(res.modalData.status).toBe('In Stock');
  });
});
