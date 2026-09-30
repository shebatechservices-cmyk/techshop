import { useState, useEffect } from 'react';

export const SECTION_TITLES = {
  dashboard: 'Dashboard',
  sales: 'Sales & POS',
  purchases: 'Purchases',
  inventory: 'Inventory & Stock',
  products: 'Products & Catalog',
  accounts: 'Accounts & Ledgers',
  expenses: 'Expenses',
  projects: 'Projects & Services',
  ecommerce: 'E-Commerce Store',
  warranty: 'Warranty & RMA',
  staff: 'Staff Management',
  reports: 'Reports & Analytics',
  soc: 'SOC Security & Audits',
  settings: 'Settings',
  trash: 'Trash & Archive',
  wallet: 'Technician Wallet',
};

export function useAppRoutingState(shopName = 'Sheba Technology') {
  const [activeTab, setActiveTab] = useState('catalog');
  const [section, setSection] = useState(() => {
    if (typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
      if (path && SECTION_TITLES[path]) {
        return path;
      }
      const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
      if (hash && SECTION_TITLES[hash]) {
        return hash;
      }
    }
    return 'dashboard';
  });

  const [globalNav, setGlobalNav] = useState({ section: null, tab: null, search: '', key: 0 });

  // Dynamic document.title & Address Bar URL Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentTitle = SECTION_TITLES[section] || 'ERP';
    document.title = `${currentTitle} | ${shopName}`;

    const targetPath = section === 'dashboard' ? '/' : `/${section}`;
    if (window.location.pathname !== targetPath && !window.location.pathname.startsWith('/api')) {
      window.history.pushState({ section }, document.title, targetPath);
    }
  }, [section, shopName]);

  // Handle Browser Back / Forward History (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
      if (path && SECTION_TITLES[path]) {
        setSection(path);
      } else if (!path) {
        setSection('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Navigation Helper
  const handleGlobalNavigate = ({ section: targetSection, tab: targetTab, search: targetSearch }) => {
    setSection(targetSection);
    if (targetSection === 'products') {
      setActiveTab(targetTab || 'catalog');
    }
    setGlobalNav({
      section: targetSection,
      tab: targetTab,
      search: targetSearch || '',
      key: Date.now(),
    });
  };

  return {
    section,
    setSection,
    activeTab,
    setActiveTab,
    globalNav,
    setGlobalNav,
    handleGlobalNavigate,
  };
}
