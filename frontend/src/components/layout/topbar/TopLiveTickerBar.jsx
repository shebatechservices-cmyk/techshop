import React, { useState } from 'react';
import QuickOfferEditModal from './QuickOfferEditModal';
import { getTickerBadgeStyle } from './tickerHelpers';
import { useLiveTickerFeed } from './useLiveTickerFeed';
import TickerControls from './TickerControls';

export default function TopLiveTickerBar({ onNavigate, currentUser }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    items,
    currentIndex,
    setIsPaused,
    isCollapsed,
    handleToggleCollapse,
    handlePrev,
    handleNext,
    activeItem,
    hasItems,
    isAdmin,
    loadFeed,
  } = useLiveTickerFeed({ currentUser });

  if (!hasItems && !isAdmin) return null;

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
                ...getTickerBadgeStyle(activeItem),
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

          {/* Right Controls */}
          <TickerControls
            itemsLength={items.length}
            currentIndex={currentIndex}
            handlePrev={handlePrev}
            handleNext={handleNext}
            isAdmin={isAdmin}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            isCollapsed={isCollapsed}
            handleToggleCollapse={handleToggleCollapse}
          />
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
