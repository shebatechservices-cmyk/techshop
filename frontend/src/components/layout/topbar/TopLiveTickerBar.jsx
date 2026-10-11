import React, { useState, useEffect, useRef } from 'react';
import API, { getAuthHeaders } from '../../../services/api';
import QuickOfferEditModal from './QuickOfferEditModal';

export default function TopLiveTickerBar({ onNavigate, currentUser }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sheba_top_ticker_collapsed') === 'true';
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const timerRef = useRef(null);

  const roleId = currentUser?.role_id;
  const role = (currentUser?.role || '').toUpperCase();
  const isAdmin = roleId === 1 || roleId === 2 || role === 'SUPER ADMIN' || role === 'ADMIN';

  const loadFeed = async () => {
    try {
      const res = await fetch(`${API}/settings/notifications`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          // Sort items so Core Offers & Urgent Stock are at the front
          const sorted = [...json.data].sort((a, b) => {
            const getRank = (item) => {
              if (item.type === 'offer_customer') return 1;
              if (item.type === 'offer_technician') return 2;
              if (item.priority === 'urgent') return 3;
              if (item.type === 'stock') return 4;
              if (item.type === 'due') return 5;
              if (item.type === 'sales') return 6;
              if (item.type === 'purchase') return 7;
              return 8;
            };
            return getRank(a) - getRank(b);
          });
          setItems(sorted);
        }
      }
    } catch (e) {
      // Quiet fail on network hiccups
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through ticker items every 6 seconds
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

  if (!currentItem && !isAdmin) return null;

  // Fallback default message if items are empty
  const defaultItem = {
    badgeText: '🔥 লাইভ ফিড',
    title: 'স্বাগতম সেবা টেকনোলজি ইআরপিতে!',
    message: 'কাস্টমার ও টেকনিশিয়ানদের জন্য সক্রিয় অফার এবং রিয়েল-টাইম নোটিফিকেশন এখানে প্রদর্শিত হবে।',
    priority: 'info',
  };

  const activeItem = currentItem || defaultItem;

  // Dynamic Badge Color
  const getBadgeStyle = (item) => {
    if (item.type === 'offer_customer') {
      return {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: '#ffffff',
        border: '1px solid #fb923c',
        boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)',
      };
    }
    if (item.type === 'offer_technician') {
      return {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        color: '#ffffff',
        border: '1px solid #a78bfa',
        boxShadow: '0 0 8px rgba(139, 92, 246, 0.4)',
      };
    }
    if (item.priority === 'urgent' || item.type === 'stock') {
      return {
        background: '#dc2626',
        color: '#ffffff',
        border: '1px solid #ef4444',
      };
    }
    if (item.type === 'sales') {
      return {
        background: '#16a34a',
        color: '#ffffff',
        border: '1px solid #22c55e',
      };
    }
    if (item.type === 'purchase') {
      return {
        background: '#2563eb',
        color: '#ffffff',
        border: '1px solid #3b82f6',
      };
    }
    if (item.type === 'due') {
      return {
        background: '#e11d48',
        color: '#ffffff',
        border: '1px solid #f43f5e',
      };
    }
    return {
      background: '#0284c7',
      color: '#ffffff',
      border: '1px solid #38bdf8',
    };
  };

  const handleItemClick = () => {
    if (onNavigate && activeItem.targetSection) {
      onNavigate({
        section: activeItem.targetSection,
        tab: activeItem.targetTab,
      });
    }
  };

  return (
    <>
      <div
        className="w-full select-none transition-all duration-200"
        style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
          borderTop: '2px solid #38bdf8',
          color: '#f8fafc',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
          {/* Left Side: Live Indicator + Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"
              title="Realtime Live Feed Active"
            />

            <span
              style={{
                ...getBadgeStyle(activeItem),
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{activeItem.icon || '📢'}</span>
              <span>{activeItem.badgeText || 'লাইভ ফিড'}</span>
            </span>
          </div>

          {/* Center: Main Cycling Headline & Message */}
          <div
            onClick={handleItemClick}
            className={`flex-1 min-w-0 flex items-center gap-2 cursor-pointer group ${
              isCollapsed ? 'hidden sm:flex' : 'flex'
            }`}
            title="Click to view related module"
          >
            <span className="font-extrabold text-sky-400 group-hover:underline flex-shrink-0 text-[11px] sm:text-xs">
              {activeItem.title}:
            </span>
            <span className="text-slate-200 truncate group-hover:text-white font-medium text-[11px] sm:text-xs">
              {activeItem.message}
            </span>
            {activeItem.targetSection && (
              <span className="text-[10px] text-sky-400 font-bold hidden md:inline group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            )}
          </div>

          {/* Right Controls: Manual navigation, Quick Offer Edit, Counter & Minimize */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Items count indicator */}
            {items.length > 1 && (
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                {currentIndex + 1}/{items.length}
              </span>
            )}

            {/* Prev & Next Arrows */}
            {items.length > 1 && (
              <div className="flex items-center gap-0.5 bg-slate-800 rounded border border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                  title="Previous Update"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                  title="Next Update"
                >
                  ›
                </button>
              </div>
            )}

            {/* Admin: Quick Core Offer Edit Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10.5px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                title="Edit Customer & Technician Live Offers"
              >
                <span>✏️</span>
                <span className="hidden lg:inline">অফার এডিট</span>
              </button>
            )}

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer transition-colors text-xs"
              title={isCollapsed ? 'Expand Live Feed' : 'Collapse Live Feed'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Core Offer Edit Modal */}
      {isEditModalOpen && (
        <QuickOfferEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={loadFeed}
        />
      )}
    </>
  );
}
