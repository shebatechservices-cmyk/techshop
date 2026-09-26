import { useState, useMemo } from 'react';
import { money, newTender } from './purchaseCartHelpers';

export function usePurchasePayment(initialTenders = []) {
  const [tenders, setTenders] = useState(initialTenders);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const addTender = (defaultAmount = 0) => {
    setTenders((prev) => [...prev, newTender(defaultAmount, false)]);
  };

  const removeTender = (id) => {
    setTenders((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTender = (id, field, value) => {
    setTenders((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const toggleAcceptTender = (id) => {
    setTenders((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isAccepted: !t.isAccepted } : t))
    );
  };

  const totalPaid = useMemo(() => {
    return tenders.reduce((sum, t) => sum + money(t.amount), 0);
  }, [tenders]);

  const resetPayment = () => {
    setTenders([]);
    setPaymentConfirmed(false);
  };

  return {
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    addTender,
    removeTender,
    updateTender,
    toggleAcceptTender,
    totalPaid,
    resetPayment,
  };
}
