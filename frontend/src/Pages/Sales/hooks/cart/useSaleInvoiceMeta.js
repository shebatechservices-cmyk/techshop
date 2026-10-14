import { useState, useEffect } from 'react';

export default function useSaleInvoiceMeta(isOpen, searchInputRef) {
  const [salesPerson, setSalesPerson] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [destination, setDestination] = useState('');
  const [attention, setAttention] = useState('');

  // Autofocus product search input on modal open
  useEffect(() => {
    if (isOpen) {
      let isAutoFocus = true;
      try {
        isAutoFocus = localStorage.getItem('pos_sale_autofocus') !== 'false';
      } catch (err) {}

      if (isAutoFocus) {
        const timer = setTimeout(() => {
          const active = document.activeElement;
          const isOtherInputFocused =
            active &&
            active !== document.body &&
            active !== searchInputRef.current &&
            (active.tagName === 'INPUT' ||
              active.tagName === 'TEXTAREA' ||
              active.tagName === 'SELECT');
          if (!isOtherInputFocused) {
            searchInputRef.current?.focus();
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, searchInputRef]);

  return {
    salesPerson,
    setSalesPerson,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
  };
}
