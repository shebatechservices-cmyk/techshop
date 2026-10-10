import React, { lazy, Suspense } from 'react';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (initialError) {
      try {
        await new Promise((r) => setTimeout(r, 250));
        return await componentImport();
      } catch (retryError) {
        const lastReload = Number(window.sessionStorage.getItem('last_chunk_reload') || '0');
        const now = Date.now();
        if (now - lastReload > 10000) {
          window.sessionStorage.setItem('last_chunk_reload', String(now));
          window.location.reload();
          return { default: () => null };
        }
        throw retryError;
      }
    }
  });

const Dashboard = lazyWithRetry(() => import('../Pages/Dashboard/Dashboard'));
const Products = lazyWithRetry(() => import('../Pages/Products/Products'));
const Purchases = lazyWithRetry(() => import('../Pages/Purchases/Purchases'));
const Inventory = lazyWithRetry(() => import('../Pages/Inventory/Inventory'));
const Sales = lazyWithRetry(() => import('../Pages/Sales/Sales'));
const Accounts = lazyWithRetry(() => import('../Pages/Accounts/Accounts'));
const Expenses = lazyWithRetry(() => import('../Pages/Accounts/Expenses'));
const Reports = lazyWithRetry(() => import('../Pages/Reports/Reports'));
const Projects = lazyWithRetry(() => import('../Pages/Projects/Projects'));
const Ecommerce = lazyWithRetry(() => import('../Pages/Ecommerce/Ecommerce'));
const Security = lazyWithRetry(() => import('../Pages/SOC_Security/Security'));
const Warranty = lazyWithRetry(() => import('../Pages/Warranty/Warranty'));
const Staff = lazyWithRetry(() => import('../Pages/Staff/Staff'));
const TechnicianWallet = lazyWithRetry(() => import('../Pages/Staff/TechnicianWallet'));
const Trash = lazyWithRetry(() => import('../Pages/Trash/Trash'));
const Settings = lazyWithRetry(() => import('../Pages/Settings/Settings'));

function PageFallback() {
  return (
    <div className="py-24 px-5 text-center text-slate-500">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-3" />
      <div className="text-xs font-semibold text-slate-600">Loading module...</div>
    </div>
  );
}

export default function AppModuleRouter({
  section,
  activeTab,
  globalNav,
  currentUser,
  isTechnician,
  setSection,
  setGlobalNav,
  handleLogout,
}) {
  return (
    <main className="flex-1 mt-2 md:mt-4 pb-24 md:pb-6">
      <div className="erp-global-frame bg-gray-50/50 p-2 sm:p-4 md:p-6 border border-gray-200 rounded-xl md:rounded-2xl shadow-xs min-h-[calc(100vh-140px)]">
        <Suspense fallback={<PageFallback />}>
          {section === 'wallet' ? (
            <TechnicianWallet currentUser={currentUser} />
          ) : section === 'inventory' && !isTechnician ? (
            <Inventory
              currentUser={currentUser}
              onOpenNewSale={(product) => {
                setSection('sales');
                setGlobalNav({
                  section: 'sales',
                  tab: 'history',
                  search: product.name || '',
                  key: Date.now(),
                });
              }}
            />
          ) : section === 'projects' ? (
            <Projects currentUser={currentUser} isTechnician={isTechnician} />
          ) : section === 'dashboard' && !isTechnician ? (
            <Dashboard />
          ) : section === 'products' && !isTechnician ? (
            <Products
              initialTab={activeTab || 'catalog'}
              initialSearch={globalNav.section === 'products' ? globalNav.search : ''}
            />
          ) : section === 'accounts' && !isTechnician ? (
            <Accounts onNavigateToExpenses={() => setSection('expenses')} />
          ) : section === 'expenses' && !isTechnician ? (
            <Expenses />
          ) : section === 'sales' && !isTechnician ? (
            <Sales
              initialTab={globalNav.section === 'sales' ? globalNav.tab || 'history' : 'history'}
              initialSearch={globalNav.section === 'sales' ? globalNav.search || '' : ''}
              navKey={globalNav.key}
              currentUser={currentUser}
            />
          ) : section === 'purchases' && !isTechnician ? (
            <Purchases
              initialTab={globalNav.section === 'purchases' ? globalNav.tab || 'history' : 'history'}
              initialSearch={globalNav.section === 'purchases' ? globalNav.search || '' : ''}
              navKey={globalNav.key}
              onOpenAddProduct={() => {
                setSection('products');
                window.dispatchEvent(new CustomEvent('open-add-product'));
              }}
            />
          ) : section === 'ecommerce' ? (
            <Ecommerce />
          ) : section === 'soc' && !isTechnician ? (
            <Security />
          ) : section === 'warranty' ? (
            <Warranty />
          ) : section === 'staff' && !isTechnician ? (
            <Staff currentUser={currentUser} />
          ) : section === 'trash' && !isTechnician ? (
            <Trash />
          ) : section === 'settings' && !isTechnician ? (
            <Settings onLogout={handleLogout} currentUser={currentUser} />
          ) : section === 'reports' && !isTechnician ? (
            <Reports />
          ) : (
            <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 shadow-sm">
              <p className="text-sky-600 font-extrabold text-xs uppercase tracking-widest">
                Sheba Technology ERP
              </p>
              <h2 className="text-lg font-bold text-slate-900 my-2.5">
                {section.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-500">
                This module is restricted or under configuration for your role. Please use the sidebar to navigate to permitted modules.
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </main>
  );
}
