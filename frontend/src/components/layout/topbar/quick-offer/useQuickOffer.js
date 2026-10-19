import { useState, useEffect } from 'react';
import API, { getAuthHeaders } from '../../../../services/api';

export function useQuickOffer({ isOpen, onClose, onSaved }) {
  const [customerOffer, setCustomerOffer] = useState('');
  const [customerOfferEnabled, setCustomerOfferEnabled] = useState(true);
  const [technicianOffer, setTechnicianOffer] = useState('');
  const [technicianOfferEnabled, setTechnicianOfferEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      setError('');
      fetch(`${API}/settings`, { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) {
            setCustomerOffer(
              json.data.customer_offer_headline ||
                '🔥 মেগা অফার: ৪টি সিসিটিভি ক্যামেরা প্যাকেজে ফ্রি রাউটার ও ইনস্টলেশন চার্জে ২০% ছাড়!'
            );
            setCustomerOfferEnabled(json.data.customer_offer_enabled !== false);
            setTechnicianOffer(
              json.data.technician_offer_headline ||
                '⚡ টেকনিশিয়ান বোনাস: চলতি সপ্তাহে ৫টি প্রজেক্ট সম্পন্ন করলে ১,০০০ টাকা বিশেষ ইনসেনটিভ!'
            );
            setTechnicianOfferEnabled(json.data.technician_offer_enabled !== false);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('অফারের তথ্য লোড করতে সমস্যা হয়েছে');
        })
        .finally(() => setFetching(false));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/settings/live-offers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          customer_offer_headline: customerOffer.trim(),
          customer_offer_enabled: customerOfferEnabled,
          technician_offer_headline: technicianOffer.trim(),
          technician_offer_enabled: technicianOfferEnabled,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert(json.message || 'অফার সফলভাবে সংরক্ষিত হয়েছে!');
        if (onSaved) onSaved();
        onClose();
      } else {
        setError(json.message || 'অফার সেভ করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setError('সার্ভার এরর');
    } finally {
      setLoading(false);
    }
  };

  return {
    customerOffer,
    setCustomerOffer,
    customerOfferEnabled,
    setCustomerOfferEnabled,
    technicianOffer,
    setTechnicianOffer,
    technicianOfferEnabled,
    setTechnicianOfferEnabled,
    loading,
    fetching,
    error,
    handleSubmit,
  };
}
