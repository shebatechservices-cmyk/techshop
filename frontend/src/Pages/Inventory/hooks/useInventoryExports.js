import API from '../../../services/api';
import { exportToCsv, generatePriceListHtml } from '../utils/inventoryUtils';

export default function useInventoryExports({
  products = [],
  filteredProducts = [],
  selectedProductIds = [],
  showNotification,
}) {
  const getSelectedOrAllProducts = () => {
    if (selectedProductIds.length > 0) {
      return products.filter((p) => selectedProductIds.includes(p.id));
    }
    return filteredProducts;
  };

  const handleDownloadCsv = () => {
    const list = getSelectedOrAllProducts();
    if (list.length === 0) {
      if (showNotification) showNotification('No products available to export', 'error');
      return;
    }
    const exported = exportToCsv(list);
    if (exported && showNotification) {
      showNotification(`Exported ${list.length} products to CSV`);
    }
  };

  const handleCopyPriceList = () => {
    const list = getSelectedOrAllProducts();
    if (list.length === 0) return;

    let text = `📦 SHEBA TECHNOLOGY - PRICE LIST (${new Date().toLocaleDateString('en-BD')})\n\n`;
    list.slice(0, 50).forEach((p, idx) => {
      text += `${idx + 1}. ${p.composite_name || p.name} | SKU: ${p.sku || 'N/A'} | Price: ৳${p.sale_price} | Stock: ${p.stock}\n`;
    });
    if (list.length > 50) text += `... and ${list.length - 50} more items.\n`;

    navigator.clipboard.writeText(text);
    if (showNotification) showNotification('Price list copied to clipboard!');
  };

  const handlePrintPriceList = async () => {
    const list = getSelectedOrAllProducts();
    let shop = {};
    try {
      const res = await fetch(`${API}/settings`);
      const json = await res.json();
      if (json && json.data) shop = json.data;
    } catch (e) {}

    const html = generatePriceListHtml(list, shop);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return {
    handleDownloadCsv,
    handleCopyPriceList,
    handlePrintPriceList,
  };
}
