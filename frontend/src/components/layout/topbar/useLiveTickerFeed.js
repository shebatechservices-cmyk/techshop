import { useState, useEffect, useRef } from 'react';
import API, { getAuthHeaders } from '../../../services/api';
import { getTickerRank, defaultTickerItem } from './tickerHelpers';

export function useLiveTickerFeed({ currentUser }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sheba_top_ticker_collapsed') === 'true';
  });
  const timerRef = useRef(null);

  const roleId = currentUser?.role_id;
  const role = (currentUser?.role || '').toUpperCase();
  const isAdmin = roleId === 1 || roleId === 2 || role === 'SUPER ADMIN' || role === 'ADMIN';

  const loadFeed = async () => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.append('user_id', currentUser.id);
      if (currentUser?.role || currentUser?.role_name) {
        params.append('role', currentUser.role || currentUser.role_name);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API}/settings/notifications${qs}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const sorted = [...json.data].sort((a, b) => getTickerRank(a) - getTickerRank(b));
          setItems(sorted);
        } else {
          setItems([]);
        }
      }
    } catch {
      // Quiet fail on network hiccups
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (items.length <= 1 || isPaused || isCollapsed) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [items.length, isPaused, isCollapsed]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sheba_top_ticker_collapsed', String(next));
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const currentItem = items[currentIndex] || items[0];
  const activeItem = currentItem || defaultTickerItem;

  return {
    items,
    currentIndex,
    isPaused,
    setIsPaused,
    isCollapsed,
    handleToggleCollapse,
    handlePrev,
    handleNext,
    activeItem,
    hasItems: Boolean(currentItem),
    isAdmin,
    loadFeed,
  };
}
