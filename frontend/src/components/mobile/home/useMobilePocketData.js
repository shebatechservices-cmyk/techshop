import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';

const getLocalDateString = (d) => {
  const date = d ? new Date(d) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function useMobilePocketData() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [salesRes, custRes, accRes] = await Promise.all([
        api.get('/sales').catch(() => ({ data: [] })),
        api.get('/customers').catch(() => ({ data: [] })),
        api.get('/accounts').catch(() => ({ data: [] })),
      ]);

      const salesList = Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data?.data || salesRes.data?.sales || []);
      const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.customers || []);
      const accList = Array.isArray(accRes.data) ? accRes.data : (accRes.data?.accounts || []);

      setSales(salesList);
      setCustomers(custList);
      setWallets(accList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleDataChanged = () => loadData(true);
    window.addEventListener('sale_created', handleDataChanged);
    window.addEventListener('due_collection_success', handleDataChanged);
    return () => {
      window.removeEventListener('sale_created', handleDataChanged);
      window.removeEventListener('due_collection_success', handleDataChanged);
    };
  }, [loadData]);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  const todaySalesList = useMemo(() => {
    return sales.filter((s) => {
      const sDate = getLocalDateString(s.created_at || s.date || s.sale_date);
      return sDate === todayStr;
    });
  }, [sales, todayStr]);

  const stats = useMemo(() => {
    let todaySalesTotal = 0;
    let todayCollectedTotal = 0;

    todaySalesList.forEach((s) => {
      todaySalesTotal += Number(s.payable_amount || s.final_amount || s.total_amount || 0);
      todayCollectedTotal += Number(s.paid_amount || 0);
    });

    const totalCustomerDue = customers.reduce((sum, c) => {
      return sum + Math.max(0, Number(c.receivable_balance ?? c.due_balance ?? c.due ?? 0));
    }, 0);

    const totalCashInAccounts = wallets.reduce((sum, w) => {
      return sum + Number(w.balance || w.current_balance || 0);
    }, 0);

    return {
      todaySalesTotal,
      todayInvoicesCount: todaySalesList.length,
      todayCollectedTotal,
      totalCustomerDue,
      totalCashInAccounts,
    };
  }, [todaySalesList, customers, wallets]);

  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);
  }, [sales]);

  return {
    stats,
    recentSales,
    loading,
    refreshing,
    refresh: () => loadData(true),
  };
}
