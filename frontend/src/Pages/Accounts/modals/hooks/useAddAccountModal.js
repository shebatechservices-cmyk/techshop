import { useState, useEffect, useMemo } from 'react';
import { smartFetch } from '../../../../services/api';
import { getAuthToken, getActiveUser } from './accountAuthHelper';

export { getAuthToken, getActiveUser };

export function useAddAccountModal({ isOpen, onClose, onSuccess }) {
  const [tenders, setTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  const [form, setForm] = useState({
    tenderId: '',
    accountName: '',
    location: '',
    openingBalance: '',
    referenceId: '',
  });

  const activeUser = useMemo(() => getActiveUser(), []);

  const fetchTenders = async () => {
    try {
      setLoadingTenders(true);
      const token = getAuthToken();
      const res = await smartFetch('/accounts/tenders', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setTenders(list);
        return list;
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
    } finally {
      setLoadingTenders(false);
    }
    return [];
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccessMsg('');
    setForm({
      tenderId: '',
      accountName: '',
      location: '',
      openingBalance: '',
      referenceId: '',
    });
    fetchTenders().then((list) => {
      if (list && list.length > 0) {
        setForm((prev) => ({ ...prev, tenderId: String(list[0].id) }));
      }
    });
  }, [isOpen]);

  const handleAccountCreated = async (newAcc) => {
    const updatedList = await fetchTenders();
    if (newAcc && newAcc.id) {
      const matched = updatedList.find(
        (t) =>
          String(t.id) === String(newAcc.tender_id || newAcc.id) ||
          t.name.toLowerCase() === newAcc.name.toLowerCase()
      );
      if (matched) {
        setForm((prev) => ({
          ...prev,
          tenderId: String(matched.id),
          accountName: prev.accountName || newAcc.name,
        }));
      } else if (updatedList.length > 0) {
        setForm((prev) => ({
          ...prev,
          accountName: prev.accountName || newAcc.name,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenderId) {
      setError('Please select a Payment Method first.');
      return;
    }
    if (!form.accountName.trim()) {
      setError('Please enter an Account Name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const tenderInt = parseInt(form.tenderId, 10);
      const payload = {
        tenderId: tenderInt,
        tender_id: tenderInt,
        accountName: form.accountName.trim(),
        name: form.accountName.trim(),
        location: form.location.trim(),
        openingBalance: parseFloat(form.openingBalance) || 0,
        referenceId: form.referenceId.trim(),
        createdBy: activeUser,
      };

      const token = getAuthToken();
      const res = await smartFetch('/accounts/account-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account record');
      }

      setSuccessMsg('Account created successfully!');
      showToast('Account created successfully!', 'success');
      if (onSuccess) onSuccess(data.data);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Error creating account');
      showToast(err.message || 'Error creating account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tenders,
    loadingTenders,
    submitting,
    error,
    setError,
    successMsg,
    isSubModalOpen,
    setIsSubModalOpen,
    toast,
    setToast,
    showToast,
    form,
    setForm,
    activeUser,
    handleAccountCreated,
    handleSubmit,
  };
}
