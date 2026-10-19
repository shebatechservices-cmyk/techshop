import { useEffect, useState } from 'react';
import API from '../../../services/api';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';

export default function useSalePrintModalState({ isOpen, docNumber, customerPhone, customerEmail, customerName }) {
  const [mode, setMode] = useState('invoice'); // 'invoice' | 'chalan'
  const [fetchedSettings, setFetchedSettings] = useState({});
  const [printTime, setPrintTime] = useState(() => new Date());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [shareStep, setShareStep] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPrintTime(new Date());
      setMode('invoice');
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${API}/settings`, { headers })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) setFetchedSettings(json.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleExecuteShare = async (actionType) => {
    const printArea = document.getElementById('sale-print-area');
    if (!printArea) return;
    setShareLoading(true);
    try {
      await shareInvoiceDocument({
        element: printArea,
        format: selectedFormat,
        action: actionType,
        docNumber,
        customerPhone,
        customerEmail,
        customerName,
        onProgress: (step) => setShareStep(step),
      });
      setShowShareModal(false);
    } catch (err) {
      console.error('Document share failed:', err);
      alert(`Sharing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setShareLoading(false);
      setShareStep(null);
    }
  };

  return {
    mode,
    setMode,
    fetchedSettings,
    printTime,
    showShareModal,
    setShowShareModal,
    shareLoading,
    selectedFormat,
    setSelectedFormat,
    shareStep,
    handleExecuteShare,
  };
}
