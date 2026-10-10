import { useState } from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

export default function useStorefrontCart() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (prod, openDrawer = true) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: fullCatalogName(prod) || prod.name,
          sku: prod.sku,
          image_url: prod.image_url,
          brand_name: prod.brand_name || prod.brand,
          warranty_period: prod.warranty_period,
          price: Number(prod.selling_price || prod.purchase_price || 0),
          quantity: 1,
          stock: Number(prod.stock || 0),
        },
      ];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const buyNow = (prod) => {
    addToCart(prod, false);
    setIsCartOpen(true);
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return {
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    buyNow,
    updateCartQty,
    cartSubtotal,
  };
}
