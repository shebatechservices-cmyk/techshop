import React from 'react';
import useTrashManager from './hooks/useTrashManager';
import TrashHeader from './components/TrashHeader';
import TrashTabs from './components/TrashTabs';
import TrashTable from './components/TrashTable';
import RecordInspectorModal from './modals/RecordInspectorModal';

export default function Trash() {
  const {
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
    loadCounts,
    loadTrash,
    handleRestore,
    handleRestoreAll,
    handlePermanentDelete,
    handleEmptyTrash,
    handleToggleSelect,
    handleSelectAll,
    handleBatchRestore,
    handleBatchDelete,
    totalTrashCount,
  } = useTrashManager();

  return (
    <div className="p-4 sm:px-5 bg-slate-900 min-h-[calc(100vh-70px)] text-slate-100 font-sans">
      {/* Toast Notification */}
      {actionMsg.text && (
        <div
          className={`fixed top-5 right-6 z-[999999] py-2.5 px-4.5 rounded-lg text-sm font-bold shadow-2xl flex items-center gap-2 text-white ${
            actionMsg.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <span>{actionMsg.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <TrashHeader
        totalTrashCount={totalTrashCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleRestoreAll={handleRestoreAll}
        handleEmptyTrash={handleEmptyTrash}
        trashItems={trashItems}
        isProcessing={isProcessing}
        loadCounts={loadCounts}
        loadTrash={loadTrash}
        selectedModule={selectedModule}
      />

      {/* 2. Module Tabs */}
      <TrashTabs
        MODULE_TABS={MODULE_TABS}
        selectedModule={selectedModule}
        setSelectedModule={setSelectedModule}
        counts={counts}
      />

      {/* 3. Data Table & Batch Toolbar */}
      <TrashTable
        trashItems={trashItems}
        loading={loading}
        selectedIds={selectedIds}
        handleToggleSelect={handleToggleSelect}
        handleSelectAll={handleSelectAll}
        handleBatchRestore={handleBatchRestore}
        handleBatchDelete={handleBatchDelete}
        handleRestore={handleRestore}
        handlePermanentDelete={handlePermanentDelete}
        setPreviewItem={setPreviewItem}
        isProcessing={isProcessing}
        searchQuery={searchQuery}
        selectedModule={selectedModule}
      />

      {/* 4. Raw Record Inspector Modal */}
      <RecordInspectorModal
        previewItem={previewItem}
        onClose={() => setPreviewItem(null)}
        handleRestore={handleRestore}
      />
    </div>
  );
}
