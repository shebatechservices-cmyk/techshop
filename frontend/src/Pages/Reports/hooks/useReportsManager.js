import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export default function useReportsManager() {
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'top_products' | 'inventory' | 'ledgers' | 'sales_audit'

  const [analytics, setAnalytics] = useState(null);
  const [auditList, setAuditList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Period label for headers & printouts
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today':
        return 'Today (আজকের)';
      case 'yesterday':
        return 'Yesterday (গতকালের)';
      case '7days':
        return 'Last 7 Days (বিগত ৭ দিন)';
      case '30days':
        return 'Last 30 Days (বিগত ৩০ দিন)';
      case 'this_month':
        return 'This Month (চলতি মাস)';
      case 'last_month':
        return 'Last Month (গত মাস)';
      case 'this_year':
        return 'This Year (চলতি বছর)';
      case 'all':
        return 'All Time (সর্বমোট)';
      case 'custom':
        return `Custom: ${customFrom || 'Start'} to ${customTo || 'End'}`;
      default:
        return period;
    }
  }, [period, customFrom, customTo]);

  // Fetch Financial Analytics & Audit Data
  const fetchData = async () => {
    try {
      setLoading(true);
      let queryParams = `period=${period}`;
      if (period === 'custom' && customFrom && customTo) {
        queryParams += `&from_date=${customFrom}&to_date=${customTo}`;
      }

      const [analyticsRes, auditRes] = await Promise.all([
        fetch(`${API}/reports/analytics?${queryParams}`).catch(() => null),
        fetch(`${API}/reports/sales-audit?${queryParams}&limit=200`).catch(() => null),
      ]);

      if (analyticsRes && analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        if (aJson.success) setAnalytics(aJson);
      }

      if (auditRes && auditRes.ok) {
        const audJson = await auditRes.json();
        if (audJson.success) setAuditList(audJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customFrom && customTo)) {
      fetchData();
    }
  }, [period, customFrom, customTo]);

  // Export Sales Audit to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const exportToCSV = () => {
    if (!auditList || auditList.length === 0) {
      alert('No audit data available to export.');
      return;
    }

    const headers = [
      'Invoice No',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Sales Person',
      'Total (BDT)',
      'Discount (BDT)',
      'VAT (BDT)',
      'Paid (BDT)',
      'Due (BDT)',
      'Estimated COGS (BDT)',
      'Estimated Gross Profit (BDT)',
      'Gross Margin (%)',
      'Payment Method',
      'Payment Status',
    ];

    const rows = auditList.map((row) => {
      const total = parseFloat(row.total_amount || 0);
      const cogs = parseFloat(row.estimated_cogs || 0);
      const profit = total - cogs;
      const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;
      const dateStr = row.created_at
        ? new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19)
        : '';

      return [
        `"${row.invoice_no || ''}"`,
        `"${dateStr}"`,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${row.customer_phone || ''}"`,
        `"${(row.sales_person || '').replace(/"/g, '""')}"`,
        total,
        parseFloat(row.discount || 0),
        parseFloat(row.vat || 0),
        parseFloat(row.paid_amount || 0),
        parseFloat(row.due_amount || 0),
        cogs,
        profit,
        margin,
        `"${(row.payment_method || 'Cash').replace(/"/g, '""')}"`,
        `"${row.payment_status || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Sales_Audit_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Audit List for table
  const filteredAudit = useMemo(() => {
    return auditList.filter((item) => {
      const matchSearch =
        (item.invoice_no || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (item.customer_name || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (item.customer_phone || '').toLowerCase().includes(auditSearch.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ? true : item.payment_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [auditList, auditSearch, statusFilter]);

  const pnl = analytics?.pnl || {};
  const inventory = analytics?.inventory || {};
  const ledgers = analytics?.ledgers || {};
  const channels = analytics?.channels || [];
  const topProducts = analytics?.top_products || [];

  const filterDates = {
    from: customFrom || analytics?.date_range?.from || 'Start Date',
    to: customTo || analytics?.date_range?.to || 'End Date',
  };

  return {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    activeTab,
    setActiveTab,
    analytics,
    auditList,
    loading,
    auditSearch,
    setAuditSearch,
    statusFilter,
    setStatusFilter,
    printModalOpen,
    setPrintModalOpen,
    periodLabel,
    filteredAudit,
    pnl,
    inventory,
    ledgers,
    channels,
    topProducts,
    filterDates,
    fetchData,
    exportToCSV,
  };
}
