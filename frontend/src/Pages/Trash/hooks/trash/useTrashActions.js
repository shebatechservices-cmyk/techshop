import API from '../../../../services/api';
import { useTrashBatchActions } from './useTrashBatchActions';

export function useTrashActions({
  selectedModule,
  searchQuery,
  selectedIds,
  setIsProcessing,
  showToast,
  notifyDataChanged,
  loadCounts,
  loadTrash,
}) {
  const batchActions = useTrashBatchActions({
    selectedIds,
    setIsProcessing,
    showToast,
    notifyDataChanged,
    loadCounts,
    loadTrash,
    selectedModule,
    searchQuery,
  });

  // Restore Single Item
  const handleRestore = async (item) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_name: item.module, id: item.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item restored successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to restore', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore All Items (in current view or all)
  const handleRestoreAll = async () => {
    const targetDesc =
      selectedModule === 'all' ? 'ALL items in the trash' : `all ${selectedModule} items`;
    if (
      !window.confirm(
        `Are you sure you want to restore ${targetDesc}? They will immediately be available in active records.`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_name: selectedModule }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'All items restored successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to restore all items', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Permanent Delete Single Item
  const handlePermanentDelete = async (item) => {
    const confirmPrompt = window.confirm(
      `⚠️ PERMANENT DELETE WARNING:
Are you absolutely sure you want to permanently delete:
"${item.title}"?

This action CANNOT be undone! The record will be permanently wiped from the database.`
    );
    if (!confirmPrompt) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/permanent`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_name: item.module, id: item.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item permanently deleted!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to delete item', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty Entire Trash
  const handleEmptyTrash = async () => {
    const targetDesc =
      selectedModule === 'all'
        ? 'the ENTIRE Recycle Bin (all modules)'
        : `all deleted ${selectedModule}`;
    const firstCheck = window.confirm(
      `🚨 CRITICAL ACTION:
You are about to EMPTY ${targetDesc}!

All deleted items will be permanently destroyed. Are you sure?`
    );
    if (!firstCheck) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/empty`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_name: selectedModule }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Trash emptied successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to empty trash', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleRestore,
    handleRestoreAll,
    handlePermanentDelete,
    handleEmptyTrash,
    handleBatchRestore: batchActions.handleBatchRestore,
    handleBatchDelete: batchActions.handleBatchDelete,
  };
}
