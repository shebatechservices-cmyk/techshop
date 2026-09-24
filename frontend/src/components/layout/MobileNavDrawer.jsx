import React from 'react';

const DRAWER_ITEMS = [
  { slug: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview & Statistics' },
  { slug: 'sales', label: 'Sales & Customers', icon: '💰', desc: 'POS Invoices, Quotations, Due Collection' },
  { slug: 'purchases', label: 'Purchases & Suppliers', icon: '🛒', desc: 'Purchase Orders & Supplier Ledgers' },
  { slug: 'inventory', label: 'Inventory & Stock', icon: '🏢', desc: 'Live Stock, Batches, Serials' },
  { slug: 'products', label: 'Products & Catalog', icon: '📦', desc: 'Product Master & Categories' },
  { slug: 'accounts', label: 'Accounts and Ledgers', icon: '💳', desc: 'Cash, Banks, Ledgers & Payment Methods' },
  { slug: 'expenses', label: 'Expenses & Overheads', icon: '💸', desc: 'Daily Expenses & Operating Costs' },
  { slug: 'reports', label: 'Reports & Analytics', icon: '📈', desc: 'Profit & Loss, Sales & Stock Reports' },
  { slug: 'projects', label: 'Projects & Services', icon: '🛠️', desc: 'CCTV Installation & Service Jobs' },
  { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐', desc: 'Online Storefront & Orders' },
  { slug: 'warranty', label: 'Warranty & Claims', icon: '🏷️', desc: 'Serial Verification & RMA' },
  { slug: 'soc', label: 'SOC Security', icon: '🛡️', desc: 'Security Audits & Activity Logs' },
  { slug: 'settings', label: 'Settings', icon: '⚙️', desc: 'Shop Profile, Printing & Backup' },
  { slug: 'trash', label: 'Trash', icon: '🗑️', desc: 'Deleted & Archived Items' },
];

export default function MobileNavDrawer({
  isOpen,
  onClose,
  activeSlug,
  onSelect,
  shopName = 'Seba Technology & Networking',
  userName = 'Super Admin',
  onLogout,
}) {
  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-backdrop" onClick={onClose}>
      <div
        className="mobile-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-user-info">
            <div className="mobile-drawer-avatar">⚡</div>
            <div>
              <h4 className="mobile-drawer-shop-title">{shopName}</h4>
              <p className="mobile-drawer-user-name">👤 {userName}</p>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={onClose}
            aria-label="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Navigation List */}
        <div className="mobile-drawer-list">
          {DRAWER_ITEMS.map((item) => {
            const isActive = activeSlug === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelect(item.slug);
                  onClose();
                }}
              >
                <span className="mobile-drawer-icon">{item.icon}</span>
                <div className="mobile-drawer-item-text">
                  <span className="mobile-drawer-item-label">{item.label}</span>
                  <span className="mobile-drawer-item-desc">{item.desc}</span>
                </div>
                {isActive && <span className="mobile-drawer-active-dot" />}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        {onLogout && (
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="mobile-drawer-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <span>🚪</span>
              <span>লগআউট (Logout)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
