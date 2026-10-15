import { useState, useMemo, useEffect } from 'react';

/**
 * Hook to manage financial computations and payment differences for sales exchange.
 */
export default function useExchangeCalculations({ returnItems = [], newItems = [] }) {
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const returnSubtotal = useMemo(() => {
    return returnItems
      .filter((it) => it.is_selected)
      .reduce(
        (sum, it) =>
          sum + Number(it.return_qty || 0) * Number(it.unit_price || 0),
        0
      );
  }, [returnItems]);

  const newSubtotal = useMemo(() => {
    return newItems.reduce(
      (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
      0
    );
  }, [newItems]);

  const netDifference = newSubtotal - returnSubtotal;

  // Auto set paid amount when difference changes
  useEffect(() => {
    if (netDifference > 0) {
      setPaidAmount(String(netDifference));
    } else if (netDifference < 0) {
      setPaidAmount(String(Math.abs(netDifference)));
    } else {
      setPaidAmount('0');
    }
  }, [netDifference]);

  return {
    returnSubtotal,
    newSubtotal,
    netDifference,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
  };
}
