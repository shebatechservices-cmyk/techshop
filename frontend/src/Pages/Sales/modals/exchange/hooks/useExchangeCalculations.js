import { useState, useMemo, useEffect } from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;

/**
 * Hook to manage financial computations and payment differences for sales exchange.
 * Automatically synchronizes with the original invoice's previous bill, paid amount, and due.
 */
export default function useExchangeCalculations({
  originalSale = null,
  returnItems = [],
  newItems = [],
}) {
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const origTotal = money(originalSale?.total_amount);
  const origPaid = money(originalSale?.paid_amount);
  const origDue = money(originalSale?.due_amount);

  const returnSubtotal = useMemo(() => {
    return (returnItems || [])
      .filter((it) => it.is_selected)
      .reduce(
        (sum, it) =>
          sum + Number(it.return_qty || 0) * Number(it.unit_price || 0),
        0
      );
  }, [returnItems]);

  const newSubtotal = useMemo(() => {
    return (newItems || []).reduce(
      (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
      0
    );
  }, [newItems]);

  const netDifference = newSubtotal - returnSubtotal;

  // Revised bill: items customer actually keeps or exchanged
  const revisedTotal = useMemo(() => {
    if (!originalSale) return Math.max(0, newSubtotal);
    return Math.max(0, origTotal - returnSubtotal + newSubtotal);
  }, [originalSale, origTotal, returnSubtotal, newSubtotal]);

  // If customer already paid more than the revised bill, they get a net cash refund
  const netCustomerRefund = useMemo(() => {
    if (!originalSale) return netDifference < 0 ? Math.abs(netDifference) : 0;
    return Math.max(0, origPaid - revisedTotal);
  }, [originalSale, origPaid, revisedTotal, netDifference]);

  // How much of the previous invoice due is cleared by return credit
  const dueCleared = useMemo(() => {
    if (!originalSale || origDue <= 0) return 0;
    const newRemainingDue = Math.max(0, revisedTotal - origPaid);
    return Math.max(0, origDue - newRemainingDue);
  }, [originalSale, origDue, revisedTotal, origPaid]);

  // Revised remaining due if customer previously paid less than the revised bill
  const revisedRemainingDue = useMemo(() => {
    if (!originalSale) return 0;
    return Math.max(0, revisedTotal - origPaid);
  }, [originalSale, revisedTotal, origPaid]);

  // Customer owes extra cash if new items exceed return credit
  const customerOwesExtra = useMemo(() => {
    if (netDifference > 0) return netDifference;
    return 0;
  }, [netDifference]);

  // Auto set paid amount intelligently when calculations change
  useEffect(() => {
    if (originalSale) {
      if (netCustomerRefund > 0) {
        setPaidAmount(String(netCustomerRefund));
      } else if (customerOwesExtra > 0) {
        setPaidAmount(String(customerOwesExtra));
      } else {
        setPaidAmount('0');
      }
    } else {
      if (netDifference > 0) {
        setPaidAmount(String(netDifference));
      } else if (netDifference < 0) {
        setPaidAmount(String(Math.abs(netDifference)));
      } else {
        setPaidAmount('0');
      }
    }
  }, [originalSale, netCustomerRefund, customerOwesExtra, netDifference]);

  return {
    returnSubtotal,
    newSubtotal,
    netDifference,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    origTotal,
    origPaid,
    origDue,
    revisedTotal,
    dueCleared,
    revisedRemainingDue,
    netCustomerRefund,
    customerOwesExtra,
  };
}
