import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to manage auto-show/hide sidebar behavior on mouse hover.
 * When unpinned, hovering over the sidebar rail immediately expands it,
 * and moving the cursor away automatically collapses it after a smooth grace timeout.
 */
export default function useSidebarHover(isPinned) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  const handleCloseHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const isExpanded = isPinned || isHovered;
  const isCollapsed = !isExpanded;

  return {
    isHovered,
    isExpanded,
    isCollapsed,
    handleMouseEnter,
    handleMouseLeave,
    handleCloseHover,
  };
}
