import { useState } from 'react';
import API from '../../../../services/api';
import { isValidBDPhone } from '../../../../utils/phoneUtils';

export default function useStorefrontAuth() {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_ecommerce_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!authName.trim() || !authPhone.trim()) {
      setAuthMsg('Please enter both name and phone number.');
      return;
    }
    if (!isValidBDPhone(authPhone)) {
      setAuthMsg('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX).');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthMsg('');
      const res = await fetch(`${API}/ecommerce/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          phone: authPhone.trim(),
          address: authAddress.trim(),
          email: authEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const custData = data.data;
        setCustomer(custData);
        localStorage.setItem('sheba_ecommerce_customer', JSON.stringify(custData));
        setAuthMsg('✓ Signed in successfully! Welcome to Sheba Online Store.');
        return custData;
      } else {
        setAuthMsg(data.message || 'Failed to sign up.');
      }
    } catch (err) {
      setAuthMsg(err.message || 'Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem('sheba_ecommerce_customer');
  };

  return {
    customer,
    setCustomer,
    authName,
    setAuthName,
    authPhone,
    setAuthPhone,
    authAddress,
    setAuthAddress,
    authEmail,
    setAuthEmail,
    authLoading,
    setAuthLoading,
    authMsg,
    setAuthMsg,
    handleAuthSubmit,
    handleCustomerLogout,
  };
}
