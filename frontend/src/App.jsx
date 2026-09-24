import "./style.css";
import React, { lazy, Suspense } from "react";
import useAppGlobalState from "./hooks/useAppGlobalState";
import useLicenseCheck from "./hooks/useLicenseCheck";
import RightHoverNav from "./components/layout/LeftHoverNav";
import TopWelcomeBar from "./components/layout/TopWelcomeBar";
import MobileQuickActionFab from "./components/layout/MobileQuickActionFab";
import MobileNavDrawer from "./components/layout/MobileNavDrawer";
import PurchaseOrderModal from "./Pages/Purchases/modals/PurchaseOrderModal";
import DeviceLimitModal from "./components/modals/DeviceLimitModal";
import LoginModal from "./components/modals/LoginModal";
import DeveloperConsoleModal from "./components/modals/DeveloperConsoleModal";
import LicenseLockScreen from "./components/layout/LicenseLockScreen";
import RegisterClosingModal from "./components/modals/RegisterClosingModal";

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (initialError) {
      try {
        await new Promise((r) => setTimeout(r, 250));
        return await componentImport();
      } catch (retryError) {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
          window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
        );
        if (!pageHasAlreadyBeenForceRefreshed) {
          window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
          window.location.reload();
          return { default: () => null };
        }
        window.sessionStorage.removeItem("page-has-been-force-refreshed");
        throw retryError;
      }
    }
  });

const Dashboard = lazyWithRetry(() => import("./Pages/Dashboard/Dashboard"));
const Products = lazyWithRetry(() => import("./Pages/Products/Products"));
const Purchases = lazyWithRetry(() => import("./Pages/Purchases/Purchases"));
const Inventory = lazyWithRetry(() => import("./Pages/Inventory/Inventory"));
const Sales = lazyWithRetry(() => import("./Pages/Sales/Sales"));
const Accounts = lazyWithRetry(() => import("./Pages/Accounts/Accounts"));
const Expenses = lazyWithRetry(() => import("./Pages/Accounts/Expenses"));
const Reports = lazyWithRetry(() => import("./Pages/Reports/Reports"));
const Projects = lazyWithRetry(() => import("./Pages/Projects/Projects"));
const Ecommerce = lazyWithRetry(() => import("./Pages/Ecommerce/Ecommerce"));
const Security = lazyWithRetry(() => import("./Pages/SOC_Security/Security"));
const Warranty = lazyWithRetry(() => import("./Pages/Warranty/Warranty"));
const Trash = lazyWithRetry(() => import("./Pages/Trash/Trash"));
const Settings = lazyWithRetry(() => import("./Pages/Settings/Settings"));

function PageFallback() {
  return (
    <div className="py-24 px-5 text-center text-slate-500">
      <div className="w-9 h-9 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-3.5" />
      <div className="text-sm font-semibold text-slate-700">Loading view...</div>
    </div>
  );
}

export default function App() {
  const {
    activeTab,
    setActiveTab,
    section,
    setSection,
    globalNav,
    setGlobalNav,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isPurchaseOpen,
    setIsPurchaseOpen,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    shopInfo,
    currentUser,
    showLoginModal,
    setShowLoginModal,
    showDevConsole,
    isDevMode,
    exitDevModeToUserMode,
    toggleDevMode,
    licenseState,
    fetchLicenseCheck,
    deviceBlocked,
    setDeviceBlocked,
    currentDeviceId,
    checkDeviceAccess,
    handleLoginSuccess,
    handleLogout,
    handleGlobalNavigate,
  } = useAppGlobalState();

  const {
    isValid: isLicenseValid,
    isExpired: isLicenseExpired,
    isBlocked: isLicenseBlocked,
    isTrial,
    hasCommercialLicense,
    trialDaysRemaining,
    trialEndDate,
    offlineGracePeriod,
    loading: licenseLoading,
    licenseData: licenseDetails,
    recheckLicense,
  } = useLicenseCheck();

  // Strict Vendor License Kill-Switch Gate: If license is invalid, expired, or blocked, render ONLY the LicenseLockScreen
  if (!licenseLoading && (!isLicenseValid || isLicenseBlocked || isLicenseExpired)) {
    return (
      <LicenseLockScreen
        licenseInfo={licenseDetails}
        onReactivated={recheckLicense}
      />
    );
  }

  // Strict Full-Screen Login Gate: If no user is authenticated, render ONLY the dedicated Login Page
  if (!currentUser) {
    return (
      <>
        <LoginModal
          isOpen={true}
          canClose={false}
          onLoginSuccess={handleLoginSuccess}
          onOpenDevConsole={toggleDevMode}
        />
        <DeveloperConsoleModal
          isOpen={showDevConsole}
          onClose={exitDevModeToUserMode}
          onSwitchToUserMode={exitDevModeToUserMode}
          onDeveloperLogin={(user) => {
            handleLoginSuccess(user);
            exitDevModeToUserMode();
          }}
        />
      </>
    );
  }

  return (
    <div className="app-frame min-h-screen bg-slate-50 text-slate-900 box-border">
      <div className="page-shell w-full px-4 sm:px-6 lg:px-8 mx-auto pb-20 md:pb-8">
        {/* Top Header Navigation */}
        <TopWelcomeBar
          shopName={shopInfo.shop_name || "Sheba Technology & Networking"}
          userName={currentUser?.name || "Super Admin"}
          branchName={shopInfo.branch_name || "Head Office - Dhaka"}
          isDevMode={isDevMode}
          onOpenDevConsole={toggleDevMode}
          onSwitchToUserMode={exitDevModeToUserMode}
          onDeveloperLogin={(user) => {
            handleLoginSuccess(user);
            exitDevModeToUserMode();
          }}
          onQuickSale={() => handleGlobalNavigate({ section: "sales" })}
          onQuickPurchase={() => setIsPurchaseOpen(true)}
          onQuickAddProduct={() => {
            setSection("products");
            window.dispatchEvent(new CustomEvent("open-add-product"));
          }}
          onQuickExpense={() => handleGlobalNavigate({ section: "expenses" })}
          onQuickWarranty={() => handleGlobalNavigate({ section: "warranty" })}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onLogout={handleLogout}
          onNavigate={handleGlobalNavigate}
          onOpenMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Discrete 15-Day Free Trial Status Banner (Strictly hidden when commercial/enterprise license is active) */}
        {!licenseLoading && isTrial && !hasCommercialLicense && isLicenseValid && !isLicenseBlocked && (
          <div className="w-full mb-3 px-4 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-base">⏳</span>
              <span>
                <strong className="text-amber-800 font-bold">Trial: {trialDaysRemaining} day(s) remaining</strong>
                <span className="hidden sm:inline text-amber-700/80 ml-1.5 font-normal">
                  (Full feature access enabled until {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : '15 days'})
                </span>
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-900 border border-amber-500/30 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
              15-Day Trial
            </span>
          </div>
        )}

        {/* Dynamic Route View */}
        <Suspense fallback={<PageFallback />}>
          {section === "dashboard" ? (
            <Dashboard />
          ) : section === "products" ? (
            <Products
              initialTab={activeTab || "catalog"}
              initialSearch={globalNav.section === "products" ? globalNav.search : ""}
            />
          ) : section === "accounts" ? (
            <Accounts onNavigateToExpenses={() => setSection("expenses")} />
          ) : section === "expenses" ? (
            <Expenses />
          ) : section === "sales" ? (
            <Sales
              initialTab={globalNav.section === "sales" ? globalNav.tab || "history" : "history"}
              initialSearch={globalNav.section === "sales" ? globalNav.search || "" : ""}
              navKey={globalNav.key}
              currentUser={currentUser}
            />
          ) : section === "purchases" ? (
            <Purchases
              initialTab={globalNav.section === "purchases" ? globalNav.tab || "history" : "history"}
              initialSearch={globalNav.section === "purchases" ? globalNav.search || "" : ""}
              navKey={globalNav.key}
              onOpenAddProduct={() => {
                setSection("products");
                window.dispatchEvent(new CustomEvent("open-add-product"));
              }}
            />
          ) : section === "inventory" ? (
            <Inventory
              onOpenNewSale={(product) => {
                setSection("sales");
                setGlobalNav({
                  section: "sales",
                  tab: "history",
                  search: product.name || "",
                  key: Date.now(),
                });
              }}
            />
          ) : section === "projects" ? (
            <Projects />
          ) : section === "ecommerce" ? (
            <Ecommerce />
          ) : section === "soc" ? (
            <Security />
          ) : section === "warranty" ? (
            <Warranty />
          ) : section === "trash" ? (
            <Trash />
          ) : section === "settings" ? (
            <Settings onLogout={handleLogout} currentUser={currentUser} />
          ) : section === "reports" ? (
            <Reports />
          ) : (
            <div className="bg-white p-10 rounded-2xl text-center border border-slate-200">
              <p className="text-sky-600 font-extrabold text-xs uppercase tracking-widest">
                Sheba Technology ERP
              </p>
              <h2 className="text-lg font-bold text-slate-900 my-2.5">
                {section.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-500">
                This module is under development. Navigate to other sections from the sidebar.
              </p>
            </div>
          )}
        </Suspense>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          <button
            type="button"
            className={`mobile-nav-item ${section === "dashboard" ? "active" : ""}`}
            onClick={() => handleGlobalNavigate({ section: "dashboard" })}
          >
            <span>📊</span>
            <small>Dashboard</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === "sales" ? "active" : ""}`}
            onClick={() => handleGlobalNavigate({ section: "sales" })}
          >
            <span>🛍️</span>
            <small>Sales</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === "purchases" ? "active" : ""}`}
            onClick={() => handleGlobalNavigate({ section: "purchases" })}
          >
            <span>📦</span>
            <small>Purchase</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === "inventory" ? "active" : ""}`}
            onClick={() => handleGlobalNavigate({ section: "inventory" })}
          >
            <span>🏬</span>
            <small>Stock</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === "accounts" ? "active" : ""}`}
            onClick={() => handleGlobalNavigate({ section: "accounts" })}
          >
            <span>💳</span>
            <small>Accounts</small>
          </button>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setIsMobileDrawerOpen(true)}
            title="More Modules"
          >
            <span>☰</span>
            <small>More</small>
          </button>
        </nav>
      </div>

      {/* Mobile Floating Action Button Speed Dial */}
      <MobileQuickActionFab
        onQuickSale={() => {
          setSection("sales");
          setGlobalNav({ section: "sales", tab: "new", key: Date.now() });
        }}
        onQuickPurchase={() => setIsPurchaseOpen(true)}
        onQuickExpense={() => {
          setSection("expenses");
          setGlobalNav({ section: "expenses", key: Date.now() });
        }}
        onQuickScanner={() => {
          setSection("inventory");
          setGlobalNav({ section: "inventory", key: Date.now() });
        }}
        onQuickAddProduct={() => {
          setSection("products");
          window.dispatchEvent(new CustomEvent("open-add-product"));
        }}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeSlug={section}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === "products") {
            setActiveTab("catalog");
          } else {
            setActiveTab("module");
          }
        }}
        shopName={shopInfo.shop_name || "Sheba Technology & Networking"}
        userName={currentUser?.name || "Super Admin"}
        onLogout={handleLogout}
      />

      {/* Right Side Hover Navigation Dock */}
      <RightHoverNav
        activeSlug={section}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === "products") {
            setActiveTab("catalog");
          } else {
            setActiveTab("module");
          }
        }}
      />

      {/* Purchase Order Modal */}
      {isPurchaseOpen && (
        <PurchaseOrderModal
          products={[]}
          onClose={() => setIsPurchaseOpen(false)}
          onSaved={() => {
            setIsPurchaseOpen(false);
            window.dispatchEvent(new CustomEvent("products_changed"));
          }}
        />
      )}

      {/* Device Session Limit Barrier Modal */}
      {deviceBlocked && (
        <DeviceLimitModal
          currentDeviceId={currentDeviceId}
          deviceType={deviceBlocked.deviceType}
          activeDevices={deviceBlocked.activeDevices}
          onRetry={checkDeviceAccess}
          onClose={() => setDeviceBlocked(null)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal || !currentUser}
        onLoginSuccess={handleLoginSuccess}
        canClose={!!currentUser}
        onClose={() => setShowLoginModal(false)}
        onOpenDevConsole={toggleDevMode}
      />

      {/* Super Admin & Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={showDevConsole}
        onClose={exitDevModeToUserMode}
        onSwitchToUserMode={exitDevModeToUserMode}
        onDeveloperLogin={(user) => {
          handleLoginSuccess(user);
          exitDevModeToUserMode();
        }}
      />



      {/* Cash Register Shift Closing Modal */}
      <RegisterClosingModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        currentUser={currentUser}
        shopInfo={shopInfo}
      />
    </div>
  );
}
