/**
 * Pure Utility Helpers for Inventory Module
 */

export const money = (val) => Number.parseFloat(val || 0) || 0;

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const getWarrantyValidity = (dateStr) => {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return null;
  const now = new Date();
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = expDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      expired: true,
      text: `Expired (${Math.abs(diffDays)}d ago)`,
      colorClass: 'text-red-500 bg-red-50'
    };
  }
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  let text = '';
  if (months > 0 && days > 0) text = `${months}m ${days}d left`;
  else if (months > 0) text = `${months}m left`;
  else text = `${days}d left`;
  const isNear = diffDays <= 15;
  return {
    expired: false,
    text,
    diffDays,
    colorClass: isNear ? 'text-amber-700 bg-amber-100' : 'text-green-700 bg-green-100'
  };
};

/**
 * Export product list to CSV
 */
export const exportToCsv = (list = [], filename) => {
  if (!list || list.length === 0) return false;

  const headers = [
    'Product ID',
    'Product Title',
    'Brand',
    'Model',
    'Category',
    'SKU',
    'Barcode',
    'Available Stock',
    'Cost Price (BDT)',
    'Sale Price (BDT)',
    'Warranty (Months)',
    'Status'
  ];

  const rows = list.map((p) => [
    p.id,
    `"${(p.composite_name || p.name || '').replace(/"/g, '""')}"`,
    `"${(p.brand_name || '').replace(/"/g, '""')}"`,
    `"${(p.model_name || '').replace(/"/g, '""')}"`,
    `"${(p.category_name || '').replace(/"/g, '""')}"`,
    `"${(p.sku || '').replace(/"/g, '""')}"`,
    `"${(p.barcode || '').replace(/"/g, '""')}"`,
    p.stock ?? 0,
    p.cost_price ?? p.costPrice ?? 0,
    p.sale_price ?? p.salePrice ?? 0,
    p.warranty_months || 0,
    p.stock_status || ''
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const exportFilename =
    filename || `Price_List_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', exportFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

/**
 * Generate full HTML template string for Label Printing
 */
export const generateLabelPrintHtml = (printContent = '', product = null) => {
  const title = product?.composite_name || product?.name || 'Product';
  return `
    <html>
      <head>
        <title>Print Labels - ${title}</title>
        <style>
          @page { size: auto; margin: 10mm; }
          body { font-family: 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 10px; }
          .label-grid { display: flex; flex-wrap: wrap; gap: 14px; }
          .label-sticker {
            width: 58mm;
            height: 38mm;
            border: 1px dashed #94a3b8;
            border-radius: 6px;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .store-name { font-size: 8pt; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
          .prod-title { font-size: 8pt; font-weight: 700; color: #0f172a; line-height: 1.1; max-height: 2.2em; overflow: hidden; }
          .prod-sku { font-size: 7pt; font-family: monospace; color: #475569; }
          .barcode-lines { height: 18px; background: repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px); }
          .prod-price { font-size: 10pt; font-weight: 900; color: #0f172a; text-align: right; }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${printContent}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
};

/**
 * Generate full HTML template string for Price List / Catalog Printing
 */
export const generatePriceListHtml = (list = [], shopData = {}, dateStr = '') => {
  const shopName = shopData.shop_name || 'Sheba Technology & Networking';
  const shopTagline =
    shopData.shop_title || 'Official Warehouse Stock & Product Price Catalog';
  const shopAddress = shopData.address ? `<p>${shopData.address}</p>` : '';
  const shopPhone = [shopData.phone, shopData.alt_phone].filter(Boolean).join(', ');
  const contactLine = [shopPhone, shopData.email].filter(Boolean).join(' · ');
  const displayDate = dateStr || new Date().toLocaleDateString('en-BD');

  return `
    <html>
      <head>
        <title>Price Catalog - ${shopName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 10px; color: #0f172a; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 1.6rem; color: #0284c7; }
          .header p { margin: 2px 0 0 0; color: #64748b; font-size: 0.85rem; }
          table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; color: #334155; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
          .price { font-weight: 800; text-align: right; color: #0f172a; }
          .stock { font-weight: 700; text-align: center; }
          .in { color: #16a34a; }
          .low { color: #d97706; }
          .out { color: #dc2626; }
          .footer { margin-top: 24px; font-size: 0.75rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${shopName}</h1>
            <p>${shopTagline}</p>
            ${shopAddress}
            ${contactLine ? `<p>${contactLine}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${displayDate}</p>
            <p><strong>Total Items:</strong> ${list.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>Product Description</th>
              <th>SKU / Code</th>
              <th>Category</th>
              <th style="text-align: center;">Stock</th>
              <th style="text-align: right;">Selling Price</th>
            </tr>
          </thead>
          <tbody>
            ${list
              .map(
                (p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.composite_name || p.name}</strong></td>
                <td style="font-family: monospace;">${p.sku || p.barcode || '—'}</td>
                <td>${p.category_name || '—'}</td>
                <td class="stock ${p.stock <= 0 ? 'out' : p.stock <= p.min_stock ? 'low' : 'in'}">${p.stock} pcs</td>
                <td class="price">৳ ${Number(p.sale_price || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated from ${shopName} ERP System • All prices subject to change without prior notice.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;
};
