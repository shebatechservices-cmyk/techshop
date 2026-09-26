import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * TableActionDropdown
 * 
 * Renders action dropdown menus via React Portals (appended to document.body)
 * with position: fixed and z-index: 99999 so that table overflow (scroll/hidden)
 * will never clip the menu.
 * 
 * Features:
 * - Precise bounding rect coordinate positioning
 * - Viewport collision detection (auto-flips upward if near bottom screen edge)
 * - Auto-reposition / dismiss on scroll & resize
 * - Click outside detection
 * - Escape key dismissal
 * - Accessible trigger & keyboard support
 */
export default function TableActionDropdown({
  trigger,
  triggerLabel = '⋮',
  triggerTitle = 'Actions',
  triggerClassName = '',
  menuClassName = '',
  align = 'right', // 'right' | 'left'
  minWidth = '160px',
  items = [],
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  ariaLabel = 'Actions Menu',
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, placement: 'bottom' });

  const setIsOpen = useCallback(
    (nextState) => {
      const value = typeof nextState === 'function' ? nextState(isOpen) : nextState;
      if (!isControlled) {
        setInternalIsOpen(value);
      }
      if (onOpenChange) {
        onOpenChange(value);
      }
    },
    [isControlled, isOpen, onOpenChange]
  );

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedMenuHeight = 220; // safe estimate for collision check

    // Check if bottom space is tight, flip to top
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldFlipTop = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    let top = shouldFlipTop ? rect.top - 4 : rect.bottom + 4;
    let right = viewportWidth - rect.right;
    let left = rect.left;

    // Boundary constraints
    if (right < 8) right = 8;
    if (left < 8) left = 8;
    if (top < 8) top = 8;

    setCoords({
      top,
      left,
      right,
      placement: shouldFlipTop ? 'top' : 'bottom',
    });
  }, []);

  const toggleDropdown = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const next = !isOpen;
    if (next) {
      calculatePosition();
    }
    setIsOpen(next);
  };

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // Recalculate on open
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (
        triggerRef.current &&
        triggerRef.current.contains(e.target)
      ) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      closeDropdown();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
    };
  }, [isOpen, closeDropdown, calculatePosition]);

  const defaultTriggerClass = `inline-flex items-center justify-center p-1.5 px-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
    isOpen
      ? 'bg-slate-200 text-slate-900 border-slate-400 shadow-inner'
      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
  } ${triggerClassName}`;

  const defaultMenuClass = `bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-[99999] overflow-hidden text-xs font-medium text-slate-800 animate-fadeIn ${menuClassName}`;

  const menuStyle = {
    position: 'fixed',
    top: coords.placement === 'top' ? 'auto' : `${coords.top}px`,
    bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : 'auto',
    ...(align === 'right'
      ? { right: `${coords.right}px`, left: 'auto' }
      : { left: `${coords.left}px`, right: 'auto' }),
    minWidth,
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
  };

  return (
    <>
      {typeof trigger === 'function' ? (
        trigger({ isOpen, toggle: toggleDropdown, ref: triggerRef })
      ) : trigger ? (
        <span ref={triggerRef} onClick={toggleDropdown} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleDropdown}
          className={defaultTriggerClass}
          title={triggerTitle}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {triggerLabel}
        </button>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className={defaultMenuClass}
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-orientation="vertical"
          >
            {children ? (
              typeof children === 'function' ? (
                children({ close: closeDropdown })
              ) : (
                children
              )
            ) : items && items.length > 0 ? (
              items.map((item, idx) => {
                if (item.divider) {
                  return (
                    <div
                      key={`divider-${idx}`}
                      className="my-1 border-t border-slate-100"
                      role="separator"
                    />
                  );
                }

                const isDanger = item.danger || item.variant === 'danger';
                const itemClass = `w-full flex items-center gap-2 px-3 py-2 text-left font-semibold cursor-pointer transition-colors border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDanger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                } ${item.className || ''}`;

                return (
                  <button
                    key={item.id || item.key || `item-${idx}`}
                    type="button"
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDropdown();
                      if (item.onClick) item.onClick(e);
                    }}
                    className={itemClass}
                    title={item.title || item.label}
                    role="menuitem"
                  >
                    {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })
            ) : null}
          </div>,
          document.body
        )}
    </>
  );
}
