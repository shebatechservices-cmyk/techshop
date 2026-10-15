import { useState, useEffect } from 'react';
import API from '../../../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;

/**
 * Hook to fetch original sale details and prepare initial return items state.
 */
export default function useExchangeSaleLoader({ isOpen, saleId, onSaleLoaded }) {
  const [loading, setLoading] = useState(true);
  const [originalSale, setOriginalSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && saleId) {
      setLoading(true);
      setError('');
      fetch(`${API}/sales/${saleId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.data) {
            const sale = data.data;
            setOriginalSale(sale);
            const items = (sale.items || []).map((it) => {
              const origUnitPrice = money(it.unit_price);
              const itemDiscount = money(it.discount);
              const qty = Math.max(1, Number(it.quantity || 1));
              const effectiveUnitPrice =
                it.line_total !== undefined && Number(it.line_total) > 0
                  ? Number((Number(it.line_total) / qty).toFixed(2))
                  : Math.max(0, origUnitPrice - Number((itemDiscount / qty).toFixed(2)));

              return {
                originalItemId: it.id,
                product_id: it.product_id,
                name: it.product_name || it.name || 'Product',
                original_qty: qty,
                return_qty: qty,
                original_unit_price: origUnitPrice,
                discount: itemDiscount,
                unit_price: effectiveUnitPrice,
                is_selected: true,
                serials: Array.isArray(it.serials) ? it.serials : [],
                selected_serials: Array.isArray(it.serials) ? [...it.serials] : [],
                condition: 'Good',
                reason: '',
              };
            });
            setReturnItems(items);
            if (onSaleLoaded) {
              onSaleLoaded(sale);
            }
          } else {
            setError(data.message || 'Failed to load sale details');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch invoice details from server');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, saleId]);

  return {
    loading,
    originalSale,
    returnItems,
    setReturnItems,
    error,
    setError,
  };
}
