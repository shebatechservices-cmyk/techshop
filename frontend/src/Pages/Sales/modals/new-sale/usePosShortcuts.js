import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage POS cashier keyboard shortcuts (F2, F3, F9, Ctrl+Enter, Esc)
 * and autofocus state persisted in localStorage.
 */
export default function usePosShortcuts({
  isOpen,
  saving,
  items,
  handleSaveSale,
  isSearchOpen,
  isCustomerOpen,
  setIsSearchOpen,
  setIsCustomerOpen,
  searchInputRef,
  customerSelectRef,
}) {
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_sale_autofocus');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleAutoFocus = () => {
    setAutoFocusEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pos_sale_autofocus', String(next));
      } catch (e) {}
      return next;
    });
  };

  const shortcutsStateRef = useRef({});
  shortcutsStateRef.current = {
    saving,
    items,
    handleSaveSale,
    isSearchOpen,
    isCustomerOpen,
    setIsSearchOpen,
    setIsCustomerOpen,
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const state = shortcutsStateRef.current;
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F3') {
        e.preventDefault();
        customerSelectRef.current?.querySelector('input')?.focus();
      } else if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F9') {
        e.preventDefault();
        if (!state.saving && state.items?.length > 0) {
          state.handleSaveSale?.();
        }
      } else if (e.key === 'Escape') {
        if (state.isSearchOpen) {
          e.preventDefault();
          state.setIsSearchOpen?.(false);
        } else if (state.isCustomerOpen) {
          e.preventDefault();
          state.setIsCustomerOpen?.(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, searchInputRef, customerSelectRef]);

  return {
    autoFocusEnabled,
    toggleAutoFocus,
  };
}
