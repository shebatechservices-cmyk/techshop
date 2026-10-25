import React from 'react';
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

      {/* 2. Mobile Navigation Side Drawer */}
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
