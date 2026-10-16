import { useState, useEffect } from 'react';
import { smartFetch } from '../../../services/api';

const DEFAULT_PAYMENT_METHODS = [
  { id: 1, name: 'Cash', type: 'cash', is_active: true },
  { id: 2, name: 'bKash', type: 'mobile_banking', is_active: true },
  { id: 3, name: 'Nagad', type: 'mobile_banking', is_active: true },
  { id: 4, name: 'Rocket', type: 'mobile_banking', is_active: true },
  { id: 5, name: 'Bank Transfer', type: 'bank', is_active: true },
];

export function useMultiTenderMethods(paymentMethodsProp = []) {
  const [dbPaymentMethods, setDbPaymentMethods] = useState(
    paymentMethodsProp || []
  );

  useEffect(() => {
    if (paymentMethodsProp && paymentMethodsProp.length > 0) {
      setDbPaymentMethods(paymentMethodsProp);
      return;
    }
    let isMounted = true;
    const fetchActiveAccounts = async () => {
      try {
        const res = await smartFetch('/accounts');
        const data = await res.json();
        if (
          isMounted &&
          res.ok &&
          data.success &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setDbPaymentMethods(data.data);
        }
      } catch (_) {
        // Fallback default methods
      }
    };
    fetchActiveAccounts();
    return () => {
      isMounted = false;
    };
  }, [paymentMethodsProp]);

  const effectivePaymentMethods =
    dbPaymentMethods.length > 0 ? dbPaymentMethods : DEFAULT_PAYMENT_METHODS;

  return {
    effectivePaymentMethods,
  };
}
