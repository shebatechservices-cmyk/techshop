import React from 'react';

export default function MobileBottomNav({
  section,
  isTechnician,
  onNavigate,
  onOpenDrawer,
}) {
  return (
    <nav className="mobile-bottom-nav md:hidden">
      {isTechnician ? (
        <>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'projects' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'projects' })}
          >
            <span>🛠️</span>
            <small>Projects</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'inventory' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'inventory' })}
          >
            <span>🏢</span>
            <small>Prices</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'wallet' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'wallet' })}
          >
            <span>👛</span>
            <small>My Wallet</small>
          </button>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={onOpenDrawer}
            title="Menu"
          >
            <span>☰</span>
            <small>Menu</small>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'dashboard' })}
          >
            <span>📊</span>
            <small>Dashboard</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'sales' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'sales' })}
          >
            <span>🛍️</span>
            <small>Sales</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'purchases' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'purchases' })}
          >
            <span>📦</span>
            <small>Purchase</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'inventory' ? 'active' : ''}`}
            onClick={() => onNavigate({ section: 'inventory' })}
          >
            <span>🏬</span>
            <small>Stock</small>
          </button>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={onOpenDrawer}
            title="More Modules"
          >
            <span>☰</span>
            <small>All Menus</small>
          </button>
        </>
      )}
    </nav>
  );
}
