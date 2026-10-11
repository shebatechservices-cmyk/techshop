// Grouped ERP Navigation Architecture
export const ERP_MENU_GROUPS = [
  {
    group: 'Main',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Operations',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'sales', label: 'Sales & POS', icon: '💰', roles: ['ADMIN', 'STAFF'] },
      { slug: 'purchases', label: 'Purchases', icon: '🛒', roles: ['ADMIN', 'STAFF'] },
      { slug: 'inventory', label: 'Inventory & Stock', icon: '🏢', roles: ['ADMIN', 'STAFF'] },
      { slug: 'products', label: 'Products & Catalog', icon: '📦', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Financials',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'accounts', label: 'Accounts & Ledgers', icon: '💳', roles: ['ADMIN', 'STAFF'] },
      { slug: 'expenses', label: 'Expenses', icon: '💸', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Services & Commerce',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'projects', label: 'Projects & Services', icon: '🛠️', roles: ['ADMIN', 'STAFF'] },
      { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐', roles: ['ADMIN', 'STAFF'] },
      { slug: 'warranty', label: 'Warranty & RMA', icon: '🏷️', roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    group: 'Administration',
    roles: ['ADMIN', 'STAFF'],
    items: [
      { slug: 'staff', label: 'Staff Management', icon: '👥', roles: ['ADMIN'] },
      { slug: 'reports', label: 'Reports & Analytics', icon: '📈', roles: ['ADMIN', 'STAFF'] },
      { slug: 'soc', label: 'SOC Security', icon: '🛡️', roles: ['ADMIN'] },
      { slug: 'settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN'] },
      { slug: 'trash', label: 'Trash', icon: '🗑️', roles: ['ADMIN'] },
    ],
  },
];

export const TECHNICIAN_MENU_ITEMS = [
  { slug: 'projects', label: 'Projects & Services', icon: '🛠️' },
  { slug: 'ecommerce', label: 'E-Commerce', icon: '🌐' },
  { slug: 'warranty', label: 'Warranty & RMA', icon: '🏷️' },
  { slug: 'wallet', label: 'My Wallet & Earnings', icon: '👛' },
];

/**
 * Filter menu groups by user role
 */
export function getFilteredMenuGroups(isSuperAdmin, isTechnician) {
  return ERP_MENU_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.roles.includes('ADMIN') && isSuperAdmin) return true;
      if (item.roles.includes('STAFF') && !isTechnician) return true;
      return false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}
