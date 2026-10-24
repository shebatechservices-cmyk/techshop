import React, { useEffect } from 'react';
import { useDeveloperConsoleManager } from '../hooks/useDeveloperConsoleManager';
import DevModalHeader from './dev/DevModalHeader';
import DevModalTabsNav from './dev/DevModalTabsNav';
import DevModalTabBody from './dev/DevModalTabBody';

export default function DeveloperConsoleModal({
  isOpen,
  onClose,
  onSwitchToUserMode,
  onDeveloperLogin,
}) {
  const manager = useDeveloperConsoleManager({ isOpen, onClose, onDeveloperLogin });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-fadeIn">
        {/* Header */}
        <DevModalHeader
          onClose={onClose}
          onSwitchToUserMode={onSwitchToUserMode}
          onDeveloperLogin={onDeveloperLogin}
          adminCreds={manager.adminCreds}
        />

        {/* Status Toast Banner */}
        {manager.statusMsg.text && (
          <div
            className={`p-3 text-xs font-bold text-center border-b ${
              manager.statusMsg.type === 'error'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {manager.statusMsg.text}
          </div>
        )}

        {/* Tab Navigation */}
        <DevModalTabsNav
          activeTab={manager.activeTab}
          setActiveTab={manager.setActiveTab}
          usersCount={manager.usersList?.length}
        />

        {/* Tab Contents */}
        <DevModalTabBody manager={manager} onClose={onClose} />
      </div>
    </div>
  );
}
