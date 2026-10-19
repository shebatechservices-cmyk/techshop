import { useState, useEffect } from 'react';
import API from '../../../services/api';
import { MODULE_TABS } from './trash/trashConstants';
import { useTrashActions } from './trash/useTrashActions';

export { MODULE_TABS };

export default function useTrashManager() {
  const [selectedModule, setSelectedModule] = useState('all');
  const [trashItems, setTrashItems] = useState([]);
  const [counts, setCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [previewItem, setPreviewItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: 'success' }), 4000);
  };

  const notifyDataChanged = () => {
    window.dispatchEvent(new CustomEvent('data_changed'));
    window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
  };

  // Load counts for all tabs
  const loadCounts = async () => {
    try {
      const res = await fetch(`${API}/trash/counts`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching trash counts:', err);
    }
  };

  // Load trash items (either 'all' or specific module)
  const loadTrash = async (mod = selectedModule, search = searchQuery) => {
    try {
      setLoading(true);
      const url = `${API}/trash/all?module=${mod}${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrashItems(data.data || []);
      } else {
        setTrashItems([]);
      }
    } catch (err) {
      console.error('Error loading trash items:', err);
      showToast('Failed to load trash data', 'error');
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  }, [selectedModule]);

  // Handle Search Input with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadTrash(selectedModule, searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Toggle selection
  const handleToggleSelect = (itemKey) => {
    setSelectedIds((prev) =>
      prev.includes(itemKey) ? prev.filter((k) => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === trashItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashItems.map((item) => `${item.module}_${item.id}`));
    }
  };

  const actions = useTrashActions({
    selectedModule,
    searchQuery,
    selectedIds,
    setIsProcessing,
    showToast,
    notifyDataChanged,
    loadCounts,
    loadTrash,
  });

  const totalTrashCount = counts.all || 0;

  return {
    MODULE_TABS,
    selectedModule,
    setSelectedModule,
    trashItems,
    counts,
    loading,
    searchQuery,
    setSearchQuery,
    selectedIds,
    actionMsg,
    previewItem,
    setPreviewItem,
    isProcessing,
    showToast,
    loadCounts,
    loadTrash,
    handleToggleSelect,
    handleSelectAll,
    totalTrashCount,
    ...actions,
  };
}
