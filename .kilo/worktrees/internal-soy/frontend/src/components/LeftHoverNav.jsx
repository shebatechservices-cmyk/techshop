import React from 'react';

const MENU_ITEMS = [
  { slug: 'dashboard', label: 'Dashboard', icon: '📊' },
  { slug: 'products', label: 'Products & Catalog', icon: '📦' },
  { slug: 'purchases', label: 'Purchases & Suppliers', icon: '🛒' },
  { slug: 'inventory', label: 'Inventory & Stock', icon: '🏢' },
  { slug: 'sales', label: 'Sales & Customers', icon: '💰' },
  { slug: 'accounts', label: 'Accounts & eWallets', icon: '💳' },
  { slug: 'expenses', label: 'Expenses & Overheads', icon: '💸' },
  { slug: 'reports', label: 'Reports & Analytics', icon: '📈' },
  { slug: 'projects', label: 'Projects & Services', icon: '🛠️' },
  { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐' },
  { slug: 'soc', label: 'SOC Security', icon: '🛡️' },
  { slug: 'warranty', label: 'Warranty & Serial', icon: '🏷️' },
  { slug: 'trash', label: 'Trash', icon: '🗑️' },
  { slug: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function LeftHoverNav({ 
  activeSlug, 
  onSelect, 
  shopName = 'Seba Technology & Networking' 
}) {
  return (
    <>
      <style>{`
        .left-hover-dock {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: auto !important;
          bottom: 0 !important;
          width: 60px;
          background: #0f172a;
          border-right: 1px solid #1e293b;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.25);
          z-index: 9999 !important;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .left-hover-dock:hover {
          width: 260px;
          box-shadow: 8px 0 30px rgba(0, 0, 0, 0.45);
        }

        .dock-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 12px 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .dock-container::-webkit-scrollbar {
          width: 4px;
        }
        .dock-container::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }

        .dock-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 8px 14px 8px;
          border-bottom: 1px solid #1e293b;
          margin-bottom: 10px;
          white-space: nowrap;
        }

        .dock-header-icon {
          font-size: 1.35rem;
          min-width: 26px;
          text-align: center;
        }

        .dock-title-group {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dock-title {
          color: #38bdf8;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dock-subtitle {
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .dock-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dock-item {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 9px 10px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #cbd5e1;
          font-size: 0.86rem;
          cursor: pointer;
          text-align: left;
          white-space: nowrap;
          transition: all 0.15s ease;
          position: relative;
        }

        .dock-item:hover {
          background: #1e293b;
          color: #38bdf8;
        }

        .dock-item.active {
          background: #1e293b;
          color: #38bdf8;
          font-weight: 600;
        }

        .dock-item-icon {
          font-size: 1.15rem;
          min-width: 24px;
          text-align: center;
          line-height: 1;
        }

        .dock-item-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dock-active-pill {
          width: 4px;
          height: 16px;
          background: #38bdf8;
          border-radius: 4px;
        }

        .app-frame {
          padding-left: 60px !important;
          transition: padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-sizing: border-box;
        }

        .app-frame:has(.left-hover-dock:hover) {
          padding-left: 260px !important;
        }
      `}</style>

      <aside className="left-hover-dock" aria-label="Navigation Dock">
        <div className="dock-container">
          <div className="dock-header">
            <span className="dock-header-icon">⚡</span>
            <div className="dock-title-group">
              <span className="dock-title">{shopName}</span>
              <span className="dock-subtitle">ERP & POS Terminal</span>
            </div>
          </div>

          <nav className="dock-list">
            {MENU_ITEMS.map((item) => {
              const isActive = activeSlug === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  className={`dock-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelect(item.slug)}
                  title={item.label}
                >
                  <span className="dock-item-icon">{item.icon}</span>
                  <span className="dock-item-text">{item.label}</span>
                  {isActive && <span className="dock-active-pill"></span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
