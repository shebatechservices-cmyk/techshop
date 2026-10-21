import React from 'react';
import MobileQuickActionFab from './MobileQuickActionFab';
import MobileNavDrawer from './MobileNavDrawer';
import MobileExperienceContainer from '../mobile/MobileExperienceContainer';

export default function MobileExperienceLayer({
  mobileActions,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  section,
  setSection,
  setActiveTab,
  currentUser,
  shopInfo,
  isTechnician,
  onQuickPurchase,
  onQuickRegister,
  handleGlobalNavigate,
  handleLogout,
}) {
  return (
    <>
      {/* 1. Mobile Pocket Hub (Bottom Sheet Drawer & Quick Action Modals) */}
      {!isTechnician && (
        <MobileExperienceContainer
          currentUser={currentUser}
          shopInfo={shopInfo}
          onOpenPurchase={onQuickPurchase}
          onOpenRegister={onQuickRegister}
          onNavigate={handleGlobalNavigate}
          mobileActions={mobileActions}
        />
      )}

      {/* 2. Floating Switcher to Mobile View when in Desktop Mode */}
      {!isTechnician && !mobileActions?.isMobileView && (
        <button
          type="button"
          onClick={mobileActions?.toggleViewMode}
          className="fixed bottom-20 left-4 z-40 px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xl flex items-center gap-1.5 active:scale-95 transition-all border border-emerald-400/40 cursor-pointer"
          title="মোবাইল পকেট ভিউতে যান"
        >
          <span>📱</span>
          <span>মোবাইল ভিউ</span>
        </button>
      )}

      {/* 3. Mobile Floating Action Button (Speed dial) */}
      {!isTechnician && (
        <div className="md:hidden">
          <MobileQuickActionFab
            onQuickSale={() => window.dispatchEvent(new CustomEvent('mobile:open_quick_pos'))}
            onQuickPurchase={onQuickPurchase}
            onQuickExpense={() => handleGlobalNavigate({ section: 'expenses' })}
            onQuickScanner={() => window.dispatchEvent(new CustomEvent('mobile:open_stock_lookup'))}
            onQuickAddProduct={() => {
              setSection('products');
              window.dispatchEvent(new CustomEvent('open-add-product'));
            }}
          />
        </div>
      )}

      {/* 4. Mobile Navigation Side Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeSlug={section}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === 'products') {
            setActiveTab('catalog');
          } else {
            setActiveTab('module');
          }
        }}
        shopName={shopInfo.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo.logo_url}
        userName={currentUser?.name || 'Super Admin'}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    </>
  );
}
