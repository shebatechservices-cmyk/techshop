import "./style.css";
import React, { lazy, Suspense, useState } from "react";
import useAppGlobalState from "./hooks/useAppGlobalState";
import useLicenseCheck from "./hooks/useLicenseCheck";
import ClassicSidebar from "./components/layout/LeftHoverNav";
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
        const lastReload = Number(window.sessionStorage.getItem("last_chunk_reload") || "0");
        const now = Date.now();
        if (now - lastReload > 10000) {
          window.sessionStorage.setItem("last_chunk_reload", String(now));
          window.location.reload();
          return { default: () => null };
        }
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
const Staff = lazyWithRetry(() => import("./Pages/Staff/Staff"));
const TechnicianWallet = lazyWithRetry(() => import("./Pages/Staff/TechnicianWallet"));
const Trash = lazyWithRetry(() => import("./Pages/Trash/Trash"));
const Settings = lazyWithRetry(() => import("./Pages/Settings/Settings"));

function PageFallback() {
  return (
    <div className="py-24 px-5 text-center text-slate-500">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-3" />
      <div className="text-xs font-semibold text-slate-600">Loading module...</div>
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    isValid: isLicenseValid,
    isExpired: isLicenseExpired,
    isBlocked: isLicenseBlocked,
    isTrial,
    hasCommercialLicense,
    trialDaysRemaining,
    trialEndDate,
    loading: licenseLoading,
    licenseData: licenseDetails,
    recheckLicense,
  } = useLicenseCheck();

  const userRole = (currentUser?.role || "").toUpperCase();
  const userRoleName = (currentUser?.role_name || "").toLowerCase();
  const isTechnician =
    userRole === "TECHNICIAN" ||
    userRoleName.includes("technician") ||
    userRoleName.includes("tech") ||
    currentUser?.role_id === 4;

  // Strict Technician Route Guard: Technicians can ONLY access projects, inventory, and wallet
  React.useEffect(() => {
    if (isTechnician) {
      const allowedTechSections = ["projects", "inventory", "wallet"];
      if (!allowedTechSections.includes(section)) {
        setSection("projects");
      }
    }
  }, [isTechnician, section, setSection]);

  // Strict Vendor License Kill-Switch Gate
  if (!licenseLoading && (!isLicenseValid || isLicenseBlocked || isLicenseExpired)) {
    return (
      <LicenseLockScreen
        licenseInfo={licenseDetails}
        onReactivated={recheckLicense}
      />
    );
  }

  // Strict Full-Screen Login Gate
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
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      {/* Classic Desktop ERP Sidebar */}
      <ClassicSidebar
        activeSlug={section}
        currentUser={currentUser}
        shopName={shopInfo.shop_name || "Sheba Technology"}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === "products") {
            setActiveTab("catalog");
          } else {
            setActiveTab("module");
          }
        }}
      />

      {/* Main Content Workspace Shell */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? "md:pl-16" : "md:pl-60"
        }`}
      >
        <div className="page-shell w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-7 pb-20 md:pb-8 flex-1 flex flex-col">
          {/* Classic Top Navigation Bar */}
          <TopWelcomeBar
            shopName={shopInfo.shop_name || "Sheba Technology"}
            userName={currentUser?.name || "Super Admin"}
            branchName={shopInfo.branch_name || "Head Office - Dhaka"}
            currentUser={currentUser}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isDevMode={isDevMode}
            onOpenDevConsole={toggleDevMode}
            onSwitchToUserMode={exitDevModeToUserMode}
            onDeveloperLogin={(user) => {
              handleLoginSuccess(user);
              exitDevModeToUserMode();
            }}
            onQuickSale={isTechnician ? undefined : () => handleGlobalNavigate({ section: "sales", tab: "new" })}
            onQuickPurchase={isTechnician ? undefined : () => setIsPurchaseOpen(true)}
            onOpenRegisterModal={isTechnician ? undefined : () => setIsRegisterModalOpen(true)}
            onLogout={handleLogout}
            onNavigate={handleGlobalNavigate}
            onOpenMenu={() => setIsMobileDrawerOpen(true)}
          />

          {/* 15-Day Free Trial Alert Banner */}
          {!licenseLoading && isTrial && !hasCommercialLicense && isLicenseValid && !isLicenseBlocked && (
            <div className="w-full mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base">⏳</span>
                <span>
                  <strong className="font-bold">Trial Active: {trialDaysRemaining} day(s) remaining</strong>
                  <span className="hidden sm:inline text-amber-800 ml-1.5 font-normal">
                    (Full ERP features unlocked until {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : '15 days'})
                  </span>
                </span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                15-Day Trial
              </span>
            </div>
          )}

          {/* Dynamic Module Route View */}
          <main className="flex-1">
            <Suspense fallback={<PageFallback />}>
              {section === "wallet" ? (
                <TechnicianWallet currentUser={currentUser} />
              ) : section === "inventory" ? (
                <Inventory
                  readOnly={isTechnician}
                  onOpenNewSale={
                    isTechnician
                      ? undefined
                      : (product) => {
                          setSection("sales");
                          setGlobalNav({
                            section: "sales",
                            tab: "history",
                            search: product.name || "",
                            key: Date.now(),
                          });
                        }
                  }
                />
              ) : section === "projects" ? (
                <Projects currentUser={currentUser} />
              ) : section === "dashboard" && !isTechnician ? (
                <Dashboard />
              ) : section === "products" && !isTechnician ? (
                <Products
                  initialTab={activeTab || "catalog"}
                  initialSearch={globalNav.section === "products" ? globalNav.search : ""}
                />
              ) : section === "accounts" && !isTechnician ? (
                <Accounts onNavigateToExpenses={() => setSection("expenses")} />
              ) : section === "expenses" && !isTechnician ? (
                <Expenses />
              ) : section === "sales" && !isTechnician ? (
                <Sales
                  initialTab={globalNav.section === "sales" ? globalNav.tab || "history" : "history"}
                  initialSearch={globalNav.section === "sales" ? globalNav.search || "" : ""}
                  navKey={globalNav.key}
                  currentUser={currentUser}
                />
              ) : section === "purchases" && !isTechnician ? (
                <Purchases
                  initialTab={globalNav.section === "purchases" ? globalNav.tab || "history" : "history"}
                  initialSearch={globalNav.section === "purchases" ? globalNav.search || "" : ""}
                  navKey={globalNav.key}
                  onOpenAddProduct={() => {
                    setSection("products");
                    window.dispatchEvent(new CustomEvent("open-add-product"));
                  }}
                />
              ) : section === "ecommerce" && !isTechnician ? (
                <Ecommerce />
              ) : section === "soc" && !isTechnician ? (
                <Security />
              ) : section === "warranty" && !isTechnician ? (
                <Warranty />
              ) : section === "staff" && !isTechnician ? (
                <Staff currentUser={currentUser} />
              ) : section === "trash" && !isTechnician ? (
                <Trash />
              ) : section === "settings" && !isTechnician ? (
                <Settings onLogout={handleLogout} currentUser={currentUser} />
              ) : section === "reports" && !isTechnician ? (
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
          </main>

          {/* Mobile Bottom Navigation Bar (Strictly Hidden on Desktop) */}
          <nav className="mobile-bottom-nav md:hidden">
            {isTechnician ? (
              <>
                <button
                  type="button"
                  className={`mobile-nav-item ${section === "projects" ? "active" : ""}`}
                  onClick={() => handleGlobalNavigate({ section: "projects" })}
                >
                  <span>🛠️</span>
                  <small>Projects</small>
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${section === "inventory" ? "active" : ""}`}
                  onClick={() => handleGlobalNavigate({ section: "inventory" })}
                >
                  <span>🏢</span>
                  <small>Prices</small>
                </button>
                <button
                  type="button"
                  className={`mobile-nav-item ${section === "wallet" ? "active" : ""}`}
                  onClick={() => handleGlobalNavigate({ section: "wallet" })}
                >
                  <span>👛</span>
                  <small>My Wallet</small>
                </button>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => setIsMobileDrawerOpen(true)}
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
                  className="mobile-nav-item"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  title="More Modules"
                >
                  <span>☰</span>
                  <small>All Menus</small>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Floating Action Button Speed Dial (Strictly Hidden on Desktop & for Technicians) */}
      {!isTechnician && (
        <div className="md:hidden">
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
        </div>
      )}

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
        shopName={shopInfo.shop_name || "Sheba Technology"}
        userName={currentUser?.name || "Super Admin"}
        currentUser={currentUser}
        onLogout={handleLogout}
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
