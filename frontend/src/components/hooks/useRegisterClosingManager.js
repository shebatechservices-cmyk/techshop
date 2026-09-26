import { useState, useEffect, useRef } from 'react';
import API_BASE from '../../services/api';

export const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export function useRegisterClosingManager({ isOpen, currentUser }) {
  const [activeTab, setActiveTab] = useState('closing'); // 'closing' | 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Shift Data State
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [lastClosedShift, setLastClosedShift] = useState(null);

  // Open Shift Form State
  const [openBalance, setOpenBalance] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  // Close Shift Form State (Blind Close)
  const [denominations, setDenominations] = useState({});
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closedSummary, setClosedSummary] = useState(null);

  // History State
  const [shiftHistory, setShiftHistory] = useState([]);
  const [selectedHistoryShift, setSelectedHistoryShift] = useState(null);

  const printRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Current Shift Status
  const fetchCurrentShift = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register/current-shift`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success) {
        setHasActiveShift(data.has_active_shift);
        setCurrentShift(data.shift);
        setLastClosedShift(data.last_closed_shift);
        if (!data.has_active_shift && data.last_closed_shift) {
          setOpenBalance(data.last_closed_shift.actual_cash_counted || '0');
        }
      } else {
        setError(data.message || 'Failed to fetch register shift status');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching shift status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Shift History
  const fetchShiftHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/register/shifts?limit=25`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success) {
        setShiftHistory(data.shifts || []);
      }
    } catch (err) {
      console.warn('Failed to fetch shift history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setClosedSummary(null);
      setDenominations({});
      setActualCashCounted('');
      setClosingNotes('');
      fetchCurrentShift();
      fetchShiftHistory();
    }
  }, [isOpen]);

  // Handle Denomination change and auto-sum
  const handleDenominationChange = (val, countStr) => {
    const count = parseInt(countStr, 10) || 0;
    const nextDenom = { ...denominations, [val]: count };
    if (count <= 0) {
      delete nextDenom[val];
    }
    setDenominations(nextDenom);

    let total = 0;
    for (const [dVal, dCount] of Object.entries(nextDenom)) {
      total += Number(dVal) * Number(dCount);
    }
    setActualCashCounted(total > 0 ? String(total) : '');
  };

  // Open Shift Submit
  const handleOpenShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/register/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          opening_balance: Number(openBalance) || 0,
          notes: openNotes,
          opened_by: currentUser?.id,
          opened_by_name: currentUser?.name || 'Cashier',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Register Shift Opened Successfully!');
        await fetchCurrentShift();
      } else {
        setError(data.message || 'Failed to open shift');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Close Shift Submit
  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!actualCashCounted && actualCashCounted !== 0) {
      setError('Please enter the physical cash counted.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to finalize and close this cash register shift?'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          actual_cash_counted: Number(actualCashCounted) || 0,
          denominations,
          notes: closingNotes,
          closed_by: currentUser?.id,
          closed_by_name: currentUser?.name || 'Cashier',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClosedSummary(data);
        setHasActiveShift(false);
        setCurrentShift(null);
        fetchShiftHistory();
      } else {
        setError(data.message || 'Failed to close register shift');
      }
    } catch (err) {
      setError(err.message || 'Network error during shift closing');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    hasActiveShift,
    currentShift,
    lastClosedShift,
    openBalance,
    setOpenBalance,
    openNotes,
    setOpenNotes,
    denominations,
    actualCashCounted,
    setActualCashCounted,
    closingNotes,
    setClosingNotes,
    closedSummary,
    setClosedSummary,
    shiftHistory,
    selectedHistoryShift,
    setSelectedHistoryShift,
    printRef,
    handleDenominationChange,
    handleOpenShift,
    handleCloseShift,
    handlePrintSlip,
    fetchCurrentShift,
    fetchShiftHistory,
  };
}
