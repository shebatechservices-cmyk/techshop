import API from '../../../../services/api';

export function useTrashBatchActions({
  selectedIds,
  setIsProcessing,
  showToast,
  notifyDataChanged,
  loadCounts,
  loadTrash,
  selectedModule,
  searchQuery,
}) {
  const handleBatchRestore = async () => {
    if (!selectedIds.length) return;
    setIsProcessing(true);
    let successCount = 0;

    for (const key of selectedIds) {
      const [mod, idStr] = key.split('_');
      try {
        const res = await fetch(`${API}/trash/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) }),
        });
        if (res.ok) successCount++;
      } catch (e) {}
    }

    showToast(`✓ Successfully restored ${successCount} items!`, 'success');
    setIsProcessing(false);
    notifyDataChanged();
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.length} selected items? This CANNOT be undone!`
      )
    )
      return;

    setIsProcessing(true);
    let successCount = 0;

    for (const key of selectedIds) {
      const [mod, idStr] = key.split('_');
      try {
        const res = await fetch(`${API}/trash/permanent`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) }),
        });
        if (res.ok) successCount++;
      } catch (e) {}
    }

    showToast(`✓ Permanently deleted ${successCount} items!`, 'success');
    setIsProcessing(false);
    notifyDataChanged();
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  };

  return {
    handleBatchRestore,
    handleBatchDelete,
  };
}
