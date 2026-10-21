import { useState, useEffect, useCallback } from 'react';
import { isNativeApp } from '../../services/api';

/**
 * Hook for managing Mobile Pocket Edition state:
 * - Bottom Action Drawer open/close
 * - Quick Action Modals (POS, Due, Stock, Scanner)
 * - View mode toggle (Mobile Pocket vs Desktop View)
 */
export default function useMobileActions() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'pos' | 'due' | 'stock' | 'scanner' | null
  
  // View mode: 'mobile' or 'desktop'
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'mobile';
    const saved = localStorage.getItem('sheba_view_mode');
    if (saved === 'desktop' || saved === 'mobile') return saved;
    // Auto-detect: if native app or screen width < 768, default to mobile
    return (isNativeApp() || window.innerWidth < 768) ? 'mobile' : 'desktop';
  });

  // Keep viewMode synced with localStorage
  const setAndSaveViewMode = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('sheba_view_mode', mode);
    } catch {
      // ignore
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    const next = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setAndSaveViewMode(next);
  }, [viewMode, setAndSaveViewMode]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const openModal = useCallback((modalName) => {
    setIsDrawerOpen(false);
    setActiveModal(modalName);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Listen for global custom events to open mobile drawer or quick modals
  useEffect(() => {
    const handleOpenDrawerEvent = () => setIsDrawerOpen(true);
    const handleOpenQuickPosEvent = () => {
      setIsDrawerOpen(false);
      setActiveModal('pos');
    };
    const handleOpenQuickDueEvent = () => {
      setIsDrawerOpen(false);
      setActiveModal('due');
    };
    const handleOpenStockLookupEvent = () => {
      setIsDrawerOpen(false);
      setActiveModal('stock');
    };

    window.addEventListener('mobile:open_drawer', handleOpenDrawerEvent);
    window.addEventListener('mobile:open_quick_pos', handleOpenQuickPosEvent);
    window.addEventListener('mobile:open_quick_due', handleOpenQuickDueEvent);
    window.addEventListener('mobile:open_stock_lookup', handleOpenStockLookupEvent);

    return () => {
      window.removeEventListener('mobile:open_drawer', handleOpenDrawerEvent);
      window.removeEventListener('mobile:open_quick_pos', handleOpenQuickPosEvent);
      window.removeEventListener('mobile:open_quick_due', handleOpenQuickDueEvent);
      window.removeEventListener('mobile:open_stock_lookup', handleOpenStockLookupEvent);
    };
  }, []);

  return {
    isDrawerOpen,
    setIsDrawerOpen,
    activeModal,
    setActiveModal,
    viewMode,
    setViewMode: setAndSaveViewMode,
    toggleViewMode,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    openModal,
    closeModal,
    isMobileView: viewMode === 'mobile',
  };
}
