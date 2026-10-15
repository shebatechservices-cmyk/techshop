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
            const items = (sale.items || []).map((it) => ({
              originalItemId: it.id,
              product_id: it.product_id,
              name: it.product_name || it.name || 'Product',
              original_qty: Number(it.quantity || 1),
              return_qty: Number(it.quantity || 1),
              unit_price: money(it.unit_price),
              is_selected: true,
              serials: Array.isArray(it.serials) ? it.serials : [],
              selected_serials: Array.isArray(it.serials) ? [...it.serials] : [],
              condition: 'Good',
              reason: '',
            }));
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
