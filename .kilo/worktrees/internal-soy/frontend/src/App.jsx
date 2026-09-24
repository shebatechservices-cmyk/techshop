import './style.css';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import RightHoverNav from './components/LeftHoverNav';
import PurchaseOrderModal from './Pages/Purchases/PurchaseOrderModal';
import TopWelcomeBar from './components/TopWelcomeBar';
import DeviceLimitModal from './components/DeviceLimitModal';
import LoginModal from './components/LoginModal';

const Accounts = lazy(() => import('./Pages/Accounts/Accounts'));
const Expenses = lazy(() => import('./Pages/Accounts/Expenses'));
const Dashboard = lazy(() => import('./Pages/Dashboard/Dashboard'));
const Purchases = lazy(() => import('./Pages/Purchases/Purchases'));
const Inventory = lazy(() => import('./Pages/Inventory/Inventory'));
const Sales = lazy(() => import('./Pages/Sales/Sales'));
const Projects = lazy(() => import('./Pages/Projects/Projects'));
const Ecommerce = lazy(() => import('./Pages/Ecommerce/Ecommerce'));
const Security = lazy(() => import('./Pages/SOC_Security/Security'));
const Warranty = lazy(() => import('./Pages/Warranty/Warranty'));
const Trash = lazy(() => import('./Pages/Trash/Trash'));
const Settings = lazy(() => import('./Pages/Settings/Settings'));
const Reports = lazy(() => import('./Pages/Reports/Reports'));

function PageFallback() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '50%',
          margin: '0 auto 14px',
          animation: 'shebaSpin 0.7s linear infinite'
        }}
      />
      <style>{`@keyframes shebaSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>Loading view...</div>
    </div>
  );
}


import API_BASE from './services/api';

const API = `${API_BASE}/master`;
const CATEGORY_API = `${API_BASE}/categories`;

function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [section, setSection] = useState('dashboard');
  const [globalNav, setGlobalNav] = useState({ section: null, tab: null, search: '', key: 0 });
  const [productFilterQuery, setProductFilterQuery] = useState('');

  // Authentication & Login Modal State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      // Must have both valid user profile AND active session token
      if (!saved || !token) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(() => {
    const saved = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    return !saved || !token;
  });

  // Support ?login=1 or ?logout=1 in URL to easily reset/view login screen
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === '1' || params.get('login') === '1') {
          localStorage.removeItem('sheba_auth_user');
          localStorage.removeItem('sheba_auth_token');
          sessionStorage.removeItem('sheba_auth_user');
          sessionStorage.removeItem('sheba_auth_token');
          setCurrentUser(null);
          setShowLoginModal(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out from Sheba ERP?')) {
      try {
        const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
        if (token) {
          await fetch(`${API_BASE}/security/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          }).catch(() => null);
        }
      } catch (err) {
        console.error('Logout error:', err);
      }
      localStorage.removeItem('sheba_auth_user');
      localStorage.removeItem('sheba_auth_token');
      sessionStorage.removeItem('sheba_auth_user');
      sessionStorage.removeItem('sheba_auth_token');
      setCurrentUser(null);
      setShowLoginModal(true);
    }
  };

  // Session Heartbeat & Token Verification (Maintains active session)
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    if (!token) return;

    const verifyInterval = setInterval(async () => {
      try {
        const currentTok = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
        if (!currentTok) return;
        const res = await fetch(`${API_BASE}/security/session-verify?token=${encodeURIComponent(currentTok)}`);
        if (res.status === 401) {
          const data = await res.json().catch(() => null);
          if (data && data.active === false && data.message === 'Account is inactive or locked') {
            clearInterval(verifyInterval);
            localStorage.removeItem('sheba_auth_user');
            localStorage.removeItem('sheba_auth_token');
            sessionStorage.removeItem('sheba_auth_user');
            sessionStorage.removeItem('sheba_auth_token');
            setCurrentUser(null);
            setShowLoginModal(true);
          }
        }
      } catch (err) {
        // network retry
      }
    }, 30000);

    return () => clearInterval(verifyInterval);
  }, [currentUser]);

  // Auto-Logout After 10 Minutes of Inactivity (idle session protection)
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    let idleTimer = null;

    const clearIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const forceLogout = () => {
      clearIdleTimer();
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      if (token) {
        fetch(`${API_BASE}/security/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }).catch(() => null);
      }
      localStorage.removeItem('sheba_auth_user');
      localStorage.removeItem('sheba_auth_token');
      sessionStorage.removeItem('sheba_auth_user');
      sessionStorage.removeItem('sheba_auth_token');
      setCurrentUser(null);
      setShowLoginModal(true);
    };

    let lastReset = 0;
    const resetIdleTimer = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return;
      lastReset = now;
      clearIdleTimer();
      idleTimer = setTimeout(forceLogout, INACTIVITY_TIMEOUT);
    };

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [currentUser]);

  // Device Limit & Access Session Management (Max 3 Desktops + Max 3 Mobiles)
  const [deviceBlocked, setDeviceBlocked] = useState(null);
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  const checkDeviceAccess = async () => {
    try {
      let devId = localStorage.getItem('app_device_id');
      if (!devId) {
        devId = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
        localStorage.setItem('app_device_id', devId);
      }
      setCurrentDeviceId(devId);

      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const devType = isMobile ? 'mobile' : 'desktop';
      const devName = localStorage.getItem('app_device_name') || (isMobile ? 'Mobile Phone' : 'Desktop / Laptop');

      const res = await fetch(`${API_BASE}/devices/check-or-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: devId,
          device_type: devType,
          device_name: devName
        })
      });
      if (!res.ok) {
        // Backend unavailable or erroring (DB down / Render cold start) — degrade
        // gracefully so the app stays usable and the browser console stays clean.
        setDeviceBlocked(null);
        return;
      }
      const data = await res.json();
      if (!data.allowed) {
        setDeviceBlocked({
          deviceType: devType,
          activeDevices: data.active_devices || []
        });
      } else {
        setDeviceBlocked(null);
      }
    } catch (err) {
      // Network/backend unreachable — degrade gracefully, no console error.
      setDeviceBlocked(null);
    }
  };

  useEffect(() => {
    checkDeviceAccess();
  }, []);

  const handleGlobalNavigate = ({ section: targetSection, tab: targetTab, search: targetSearch }) => {
    setSection(targetSection);
    if (targetSection === 'products') {
      setActiveTab(targetTab || 'catalog');
      setProductFilterQuery(targetSearch || '');
      setCurrentPage(1);
    }
    setGlobalNav({
      section: targetSection,
      tab: targetTab,
      search: targetSearch || '',
      key: Date.now(),
    });
  };
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [models, setModels] = useState([]);
  const [series, setSeries] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({ shop_name: 'Sheba Technology & Networking', branch_name: 'Head Office - Dhaka' });
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openProductAction, setOpenProductAction] = useState(null);
  const productsPerPage = 20;

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');

  const [quickAdd, setQuickAdd] = useState({
    isOpen: false,
    entity: null,
    title: '',
    subtitle: '',
    label: '',
    placeholder: '',
    value: '',
    extraInfo: '',
    error: '',
    loading: false
  });
  const [quickEdit, setQuickEdit] = useState({
    isOpen: false,
    entity: '',
    id: null,
    title: '',
    subtitle: '',
    label: 'Name',
    value: '',
    loading: false,
    error: '',
  });
  const generateAutoSku = () => `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

  const [featureImageFile, setFeatureImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);
  const [featureImagePreview, setFeatureImagePreview] = useState(null);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [duplicatePopupMessage, setDuplicatePopupMessage] = useState('');
  const [showAttributeAdd, setShowAttributeAdd] = useState({
    categories: false,
    sub_categories: false,
  });
  const [attributeDraft, setAttributeDraft] = useState({
    categories: '',
    sub_categories: '',
    sub_category_parent: '',
  });
  const [attributeError, setAttributeError] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: generateAutoSku(),
    stock: 0,
    status: 'active',
    description: '',
    category_id: '',
    sub_category_id: '',
    brand_id: '',
    model_id: '',
    series_id: '',
    min_stock: 5,
    image_url: '',
    condition: 'New',
    is_service: false,
    is_bundle: false,
    tracks_serial: true,
  });

  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  };

  const reloadProducts = async () => {
    const productData = await fetchJson(`${API}/products`);
    setProducts(productData);
  };

  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      try {
        const [categoryData, subCategoryData, brandData, modelData, seriesData, productData, productNamesData, settingsData] = await Promise.all([
          fetchJson(`${API}/categories`),
          fetchJson(`${API}/sub_categories`),
          fetchJson(`${API}/brands`),
          fetchJson(`${API}/models`),
          fetchJson(`${API}/series`),
          fetchJson(`${API}/products`),
          fetchJson(`${API}/product_names`).catch(() => []),
          fetch(`${API_BASE}/settings`).then((r) => (r.ok ? r.json() : { data: {} })).catch(() => ({ data: {} })),
        ]);

        setCategories(categoryData);
        setSubCategories(subCategoryData);
        setBrands(brandData);
        setModels(modelData);
        setSeries(seriesData);
        setProducts(productData);
        setProductNames(productNamesData || []);
        if (settingsData && settingsData.data) {
          setShopInfo((prev) => ({ ...prev, ...settingsData.data }));
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    loadData();

    const handleOpenAddProductEvent = () => {
      setSection('products');
      setActiveTab('catalog');
      handleResetForm();
      setIsAddProductOpen(true);
    };
    const handleStockReload = () => {
      reloadProducts();
    };
    window.addEventListener('open-add-product', handleOpenAddProductEvent);
    window.addEventListener('inventory_stock_changed', handleStockReload);
    window.addEventListener('products_changed', handleStockReload);
    return () => {
      window.removeEventListener('open-add-product', handleOpenAddProductEvent);
      window.removeEventListener('inventory_stock_changed', handleStockReload);
      window.removeEventListener('products_changed', handleStockReload);
    };
  }, [currentUser]);

  const catalogSubCategories = selectedCategory
    ? subCategories.filter((item) => String(item.category_id) === String(selectedCategory))
    : [];

  const catalogBrands = selectedSubCategory
    ? brands.filter((item) => !item.sub_category_id || String(item.sub_category_id) === String(selectedSubCategory))
    : brands;

  useEffect(() => {
    if (!currentUser) return;
    const isBrandValid = selectedBrand && selectedBrand !== 'undefined' && selectedBrand !== 'null';
    if (!isBrandValid) {
      setProductNames([]);
      return;
    }
    const query = new URLSearchParams();
    query.set('brand_id', selectedBrand);
    if (selectedSubCategory && selectedSubCategory !== 'undefined' && selectedSubCategory !== 'null') {
      query.set('sub_category_id', selectedSubCategory);
    }
    fetchJson(`${API}/product_names?${query.toString()}`)
      .then((data) => setProductNames(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Product names fetch error:', err));
  }, [currentUser, selectedBrand, selectedSubCategory]);

  useEffect(() => {
    if (!currentUser) return;
    if (!selectedBrand || selectedBrand === 'undefined' || selectedBrand === 'null') {
      setModels([]);
      setSelectedModel('');
      return;
    }

    const queryObj = { brand_id: selectedBrand };
    if (selectedCategory && selectedCategory !== 'undefined' && selectedCategory !== 'null') {
      queryObj.category_id = selectedCategory;
    }
    if (selectedSubCategory && selectedSubCategory !== 'undefined' && selectedSubCategory !== 'null') {
      queryObj.sub_category_id = selectedSubCategory;
    }
    const query = new URLSearchParams(queryObj).toString();

    fetchJson(`${API}/models?${query}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setModels(list);
        setSelectedModel((prev) => (prev && list.some((m) => String(m.id) === String(prev)) ? prev : ''));
      })
      .catch((err) => console.error(err));
  }, [currentUser, selectedBrand, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    if (!currentUser) return;
    if (!selectedBrand || selectedBrand === 'undefined' || selectedBrand === 'null') {
      setSeries([]);
      setSelectedSeries('');
      return;
    }

    const seriesQuery = new URLSearchParams({ brand_id: selectedBrand });
    if (selectedModel && selectedModel !== 'undefined' && selectedModel !== 'null') {
      seriesQuery.set('model_id', selectedModel);
    }

    fetchJson(`${API}/series?${seriesQuery.toString()}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSeries(list);
        setSelectedSeries((prev) => (prev && list.some((s) => String(s.id) === String(prev)) ? prev : ''));
      })
      .catch((err) => console.error(err));
  }, [currentUser, selectedBrand, selectedModel]);

  useEffect(() => {
    if (!openProductAction) return;
    const handleClickOutside = () => {
      setOpenProductAction(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openProductAction]);

  const persistMasterItem = async (entity, payload) => {
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('Please enter a name');

    let url = `${API}/${entity}`;
    let body = { ...payload, name };

    if (entity === 'categories') {
      url = `${CATEGORY_API}/add`;
      body = { name };
    } else if (entity === 'sub_categories') {
      if (!payload.category_id) throw new Error('Please select a category');
      url = `${CATEGORY_API}/sub/add`;
      body = { name, category_id: Number(payload.category_id) };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Add item failed');
    return result.data;
  };

  const mergeCreatedItem = (entity, created, { select = false } = {}) => {
    if (!created) return;
    if (entity === 'categories') {
      setCategories((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedCategory(String(created.id));
      return;
    }
    if (entity === 'sub_categories') {
      setSubCategories((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedSubCategory(String(created.id));
      return;
    }
    if (entity === 'brands') {
      setBrands((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedBrand(String(created.id));
      return;
    }
    if (entity === 'product_names' || entity === 'product_name') {
      setProductNames((prev) => (prev.some((item) => item.id === created.id || item.name === created.name) ? prev : [...prev, created]));
      if (select) {
        setForm((prev) => ({ ...prev, name: created.name, model_id: '', series_id: '' }));
        setSelectedModel('');
        setSelectedSeries('');
      }
      return;
    }
    if (entity === 'models') {
      setModels((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedModel(String(created.id));
      return;
    }
    if (entity === 'series') {
      setSeries((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedSeries(String(created.id));
      return;
    }
  };

  const openQuickAddModal = (entity) => {
    const configs = {
      categories: {
        title: 'Add New Category',
        subtitle: 'Create primary category group for products',
        label: 'Category Name',
        placeholder: 'e.g., Security & Surveillance / Networking / Computers',
        extraInfo: '',
      },
      sub_categories: {
        title: 'Add New Sub-Category',
        subtitle: selectedCategory
          ? `Selected Category: "${categories.find((c) => String(c.id) === String(selectedCategory))?.name || ''}"`
          : 'Create sub-category group',
        label: 'Sub-Category Name',
        placeholder: 'e.g., IP Cameras / WiFi Routers / Desktop Accessories',
        extraInfo: !selectedCategory ? 'Please select a category first' : '',
      },
      brands: {
        title: 'Add New Brand',
        subtitle: selectedSubCategory
          ? `Selected Sub-Category: "${subCategories.find((s) => String(s.id) === String(selectedSubCategory))?.name || ''}"`
          : 'Add product manufacturer or brand',
        label: 'Brand Name',
        placeholder: 'e.g., Dahua, Hikvision, TP-Link, HP, Dell',
        extraInfo: (isAddProductOpen && !selectedSubCategory) ? 'Please select a sub-category first' : '',
      },
      product_name: {
        title: 'Add New Product Name',
        subtitle: selectedBrand
          ? `Selected Brand: "${brands.find((b) => String(b.id) === String(selectedBrand))?.name || ''}"`
          : 'Define base product name or item type',
        label: 'Product Name',
        placeholder: 'e.g., HDD, SSD, Bullet Camera, WiFi Router, Gigabit Switch',
        extraInfo: !selectedBrand ? 'Please select a brand first' : '',
      },
      product_names: {
        title: 'Add New Product Name',
        subtitle: 'Define base product name or item type for catalog',
        label: 'Product Name',
        placeholder: 'e.g., HDD, SSD, Bullet Camera, WiFi Router, Gigabit Switch',
        extraInfo: '',
      },
      models: {
        title: 'Add New Model',
        subtitle: form.name
          ? `Selected Product: "${previewBrand} ${form.name}"`
          : 'Add specific model name or number',
        label: 'Model Name / Number',
        placeholder: 'e.g., DH-IPC-HFW1230S / Archer C6 / Pavilion 15',
        extraInfo: !form.name ? 'Please select a product name first' : '',
      },
      series: {
        title: 'Add New Series',
        subtitle: selectedModel
          ? `Selected Model: "${previewBrand} ${form.name} ${previewModel}"`
          : 'Add product series or collection family',
        label: 'Series Name',
        placeholder: 'e.g., Pro Series / Lite Series / Vostro / ThinkPad',
        extraInfo: !selectedModel ? 'Please select a model first' : '',
      },
    };

    const config = configs[entity];
    if (!config) return;
    setQuickAdd({
      isOpen: true,
      entity,
      title: config.title,
      subtitle: config.subtitle,
      label: config.label,
      placeholder: config.placeholder,
      value: '',
      extraInfo: config.extraInfo,
      error: '',
      loading: false,
    });
  };

  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    const val = quickAdd.value.trim();
    if (!val) {
      setQuickAdd((prev) => ({ ...prev, error: 'Please enter a name' }));
      return;
    }

    try {
      setQuickAdd((prev) => ({ ...prev, loading: true, error: '' }));
      let payload = { name: val };
      if (quickAdd.entity === 'sub_categories') {
        if (!selectedCategory) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a category first' }));
          return;
        }
        payload.category_id = Number(selectedCategory);
      } else if (quickAdd.entity === 'brands') {
        if (isAddProductOpen && !selectedSubCategory) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a sub-category first' }));
          return;
        }
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === 'product_name' || quickAdd.entity === 'product_names') {
        if (isAddProductOpen && !selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a brand first' }));
          return;
        }
        if (selectedBrand) payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === 'models') {
        if (!selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a brand first' }));
          return;
        }
        if (!form.name) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a product name first' }));
          return;
        }
        payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === 'series') {
        if (!selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a brand first' }));
          return;
        }
        if (!selectedModel) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: 'Please select a model first' }));
          return;
        }
        payload.brand_id = Number(selectedBrand);
        payload.model_id = Number(selectedModel);
      }

      const targetEntity = (quickAdd.entity === 'product_name' || quickAdd.entity === 'product_names')
        ? 'product_names'
        : quickAdd.entity;
      const created = await persistMasterItem(targetEntity, payload);
      mergeCreatedItem(quickAdd.entity, created, { select: true });
      setQuickAdd({ isOpen: false, entity: null, title: '', subtitle: '', label: '', placeholder: '', value: '', extraInfo: '', error: '', loading: false });
    } catch (err) {
      setQuickAdd((prev) => ({ ...prev, loading: false, error: err.message || 'Failed to add item' }));
    }
  };

  const loadDummyProducts = async () => {
    try {
      setSaveSuccess('Loading sample products...');
      const rand = Math.floor(100 + Math.random() * 900);
      const sampleItems = [
        {
          name: '2MP Full Color Bullet Camera',
          sku: `CAM-DH-2MP-${rand}`,
          stock: 25,
          min_stock: 5,
          status: 'active',
          condition: 'New',
          description: 'Dahua 2MP Full Color Night Vision Outdoor CCTV Camera.',
        },
        {
          name: 'Archer C6 AC1200 Gigabit Router',
          sku: `RTR-TPL-C6-${rand}`,
          stock: 14,
          min_stock: 3,
          status: 'active',
          condition: 'New',
          description: 'TP-Link Dual Band Gigabit WiFi Router.',
        },
        {
          name: '4 Channel Full HD DVR Recorder',
          sku: `DVR-HIK-4CH-${rand}`,
          stock: 8,
          min_stock: 2,
          status: 'active',
          condition: 'New',
          description: 'Hikvision 4 Channel HD Real-time Recording DVR.',
        },
        {
          name: '2TB SkyHawk Surveillance Hard Disk',
          sku: `HDD-SEA-2TB-${rand}`,
          stock: 12,
          min_stock: 4,
          status: 'active',
          condition: 'New',
          description: 'Seagate SkyHawk Surveillance Internal Hard Drive.',
        },
        {
          name: '16 Port Fast Ethernet Desktop Switch',
          sku: `SW-DLK-16P-${rand}`,
          stock: 6,
          min_stock: 2,
          status: 'active',
          condition: 'New',
          description: 'D-Link 16-Port Fast Ethernet Unmanaged Network Switch.',
        },
      ];

      for (const item of sampleItems) {
        await fetch(`${API}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      await reloadProducts();
      setSaveSuccess('5 sample products loaded successfully. You can delete them anytime.');
    } catch (err) {
      console.error(err);
      setSaveError('Failed to load sample products.');
    }
  };

  const saveAttributeItem = async (entity) => {
    setAttributeError('');
    try {
      const payload = entity === 'sub_categories'
        ? { name: attributeDraft.sub_categories, category_id: Number(attributeDraft.sub_category_parent) }
        : { name: attributeDraft.categories };
      const created = await persistMasterItem(entity, payload);
      mergeCreatedItem(entity, created);
      setAttributeDraft((prev) => ({
        ...prev,
        [entity]: '',
        ...(entity === 'sub_categories' ? { sub_category_parent: '' } : {}),
      }));
      setShowAttributeAdd((prev) => ({ ...prev, [entity]: false }));
    } catch (error) {
      setAttributeError(error.message);
    }
  };

  const refreshAttributeEntity = async (entity) => {
    const data = await fetchJson(`${API}/${entity}`);
    const setters = { categories: setCategories, sub_categories: setSubCategories, brands: setBrands, product_names: setProductNames, models: setModels, series: setSeries };
    if (setters[entity]) setters[entity](data);
  };

  const openQuickEditModal = (entity, item) => {
    const titleMap = {
      categories: 'Category',
      sub_categories: 'Sub-category',
      brands: 'Brand',
      product_names: 'Product Name',
      models: 'Model',
      series: 'Series',
    };
    setQuickEdit({
      isOpen: true,
      entity,
      id: item.id,
      title: `Edit ${titleMap[entity] || entity}`,
      subtitle: `Update name for "${item.name}"`,
      label: 'Name',
      value: item.name,
      loading: false,
      error: '',
    });
  };

  const handleQuickEditSave = async (event) => {
    event.preventDefault();
    const trimmed = quickEdit.value.trim();
    if (!trimmed) {
      setQuickEdit((prev) => ({ ...prev, error: 'Name cannot be empty' }));
      return;
    }
    setQuickEdit((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch(`${API}/${quickEdit.entity}/${quickEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update attribute');
      await refreshAttributeEntity(quickEdit.entity);
      await reloadProducts();
      setQuickEdit((prev) => ({ ...prev, isOpen: false, loading: false }));
      setSaveSuccess(`${quickEdit.title} updated successfully.`);
    } catch (err) {
      setQuickEdit((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const deleteAttribute = async (entity, item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      const response = await fetch(`${API}/${entity}/${item.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        await refreshAttributeEntity(entity);
        await reloadProducts();
        setSaveSuccess(data.message || 'Deleted successfully.');
      } else {
        window.alert(data.error || 'This attribute cannot be deleted because it is used in the catalog.');
      }
    } catch (err) {
      window.alert('Network error while deleting attribute.');
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Image preview effects
  useEffect(() => {
    if (!featureImageFile) {
      setFeatureImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(featureImageFile);
    setFeatureImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [featureImageFile]);

  useEffect(() => {
    if (!galleryImageFiles || galleryImageFiles.length === 0) {
      setGalleryImagePreviews([]);
      return;
    }
    const urls = galleryImageFiles.map((f) => URL.createObjectURL(f));
    setGalleryImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryImageFiles]);

  const handleResetForm = () => {
    setForm({
      name: '',
      sku: generateAutoSku(),
      stock: 0,
      status: 'active',
      description: '',
      category_id: '',
      sub_category_id: '',
      brand_id: '',
      model_id: '',
      series_id: '',
      min_stock: 5,
      image_url: '',
      condition: 'New',
      is_service: false,
      is_bundle: false,
      tracks_serial: true,
    });
    setEditingProductId(null);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedSeries('');
    setFeatureImageFile(null);
    setGalleryImageFiles([]);
    setFeatureImagePreview(null);
    setGalleryImagePreviews([]);
    setFileInputKey((k) => k + 1);
    setSaveError('');
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setSelectedCategory(product.category_id ? String(product.category_id) : '');
    setSelectedSubCategory(product.sub_category_id ? String(product.sub_category_id) : '');
    setSelectedBrand(product.brand_id ? String(product.brand_id) : '');
    setSelectedModel(product.model_id ? String(product.model_id) : '');
    setSelectedSeries(product.series_id ? String(product.series_id) : '');
    setForm({
      name: product.name || '',
      sku: product.sku || generateAutoSku(),
      stock: product.stock !== undefined ? product.stock : 0,
      status: product.status || 'active',
      description: product.description || '',
      category_id: product.category_id || '',
      sub_category_id: product.sub_category_id || '',
      brand_id: product.brand_id || '',
      model_id: product.model_id || '',
      series_id: product.series_id || '',
      min_stock: product.min_stock !== undefined ? product.min_stock : 5,
      image_url: product.image_url || '',
      condition: product.condition || 'New',
      is_service: product.is_service || false,
      is_bundle: product.is_bundle || false,
      tracks_serial: product.tracks_serial !== undefined ? Boolean(product.tracks_serial) : true,
    });
    setFeatureImageFile(null);
    setGalleryImageFiles([]);
    setFeatureImagePreview(null);
    setGalleryImagePreviews([]);
    setFileInputKey((k) => k + 1);
    setSaveError('');
    setSaveSuccess('');
    setIsAddProductOpen(true);
    setOpenProductAction(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setDuplicatePopupMessage('');
    if (!selectedCategory || !selectedSubCategory || !selectedBrand || !form.name || !selectedModel || !selectedSeries) {
      setSaveError('Please select all cascading fields from Category to Series.');
      return;
    }
    const optionalId = (value) => value ? Number(value) : null;

    // Check duplicate in catalog before submitting
    if (!editingProductId) {
      const norm = (val) => String(val || '').trim().toLowerCase();
      const inputSku = norm(form.sku);
      const inputBarcode = norm(form.barcode);
      const inputName = norm(form.name);
      const catId = optionalId(selectedCategory || form.category_id);
      const subCatId = optionalId(selectedSubCategory || form.sub_category_id);
      const brandId = optionalId(selectedBrand || form.brand_id);
      const modelId = optionalId(selectedModel || form.model_id);
      const seriesId = optionalId(selectedSeries || form.series_id);

      const isDuplicate = products.some((p) => {
        if (inputSku && norm(p.sku) === inputSku) return true;
        if (inputBarcode && norm(p.barcode) === inputBarcode) return true;
        const sameName = norm(p.name) === inputName;
        const sameCat = !catId || Number(p.category_id) === catId;
        const sameSub = !subCatId || Number(p.sub_category_id) === subCatId;
        const sameBrand = !brandId || Number(p.brand_id) === brandId;
        const sameModel = !modelId || Number(p.model_id) === modelId;
        const sameSeries = !seriesId || Number(p.series_id) === seriesId;
        return sameName && sameCat && sameSub && sameBrand && sameModel && sameSeries;
      });

      if (isDuplicate) {
        const msg = 'Already added this product, add a new product for catalog';
        setSaveError(msg);
        setDuplicatePopupMessage(msg);
        return;
      }
    }

    const payload = {
      ...form,
      category_id: optionalId(selectedCategory || form.category_id),
      sub_category_id: optionalId(selectedSubCategory || form.sub_category_id),
      brand_id: optionalId(selectedBrand || form.brand_id),
      model_id: optionalId(selectedModel || form.model_id),
      series_id: optionalId(selectedSeries || form.series_id),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
    };

    try {
      const url = editingProductId ? `${API}/products/${editingProductId}` : `${API}/products`;
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || 'Failed to save product';
        if (errMsg.includes('Already added') || res.status === 409) {
          const msg = 'Already added this product, add a new product for catalog';
          setSaveError(msg);
          setDuplicatePopupMessage(msg);
          return;
        }
        throw new Error(errMsg);
      }

      const resData = await res.json();
      const targetId = editingProductId || resData.data?.id;

      if (targetId && (featureImageFile || galleryImageFiles.length)) {
        const imageData = new FormData();
        if (featureImageFile) {
          imageData.append('images', featureImageFile);
          imageData.append('type', 'feature');
        }
        galleryImageFiles.forEach((file) => imageData.append('images', file));
        await fetch(`${API.replace('/master', '')}/images/products/${targetId}`, {
          method: 'POST',
          body: imageData,
        }).catch(() => {});
      }

      await reloadProducts();
      handleResetForm();
      setIsAddProductOpen(false);
      setSaveSuccess(editingProductId ? 'Product updated successfully.' : 'Product saved successfully to catalog.');
      setEditingProductId(null);
    } catch (error) {
      setSaveError(error.message || 'Failed to save product. Please check all fields.');
      console.error('Submit error:', error);
    }
  };

  const openAddProduct = () => {
    handleResetForm();
    setIsAddProductOpen(true);
  };

  const sectionTitle = {
    dashboard: 'Dashboard',
    products: 'Products & Catalog',
    purchases: 'Purchases & Suppliers',
    inventory: 'Inventory & Stock',
    sales: 'Sales & Customers',
    accounts: 'Accounts & eWallets',
    reports: 'Reports & Analytics',
    projects: 'Projects & Services',
    ecommerce: 'E-Commerce',
    soc: 'SOC Security',
    warranty: 'Warranty & Claims',
    trash: 'Trash',
    settings: 'Settings',
  }[section] || (activeTab === 'attributes' ? 'Categories & Attributes' : 'Products & Catalog');

  const productLabel = (product) => [product.brand_name, product.name, product.model_name, product.series_name]
    .filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' ');

  const filteredProducts = products.filter((p) => {
    if (!productFilterQuery.trim()) return true;
    const q = productFilterQuery.trim().toLowerCase();
    const label = productLabel(p).toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const barcode = (p.barcode || '').toLowerCase();
    const cat = (p.category_name || '').toLowerCase();
    const sub = (p.sub_category_name || '').toLowerCase();
    return label.includes(q) || sku.includes(q) || barcode.includes(q) || cat.includes(q) || sub.includes(q);
  });

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  const toggleProduct = (id) => setSelectedProductIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAllProducts = () => {
    const ids = visibleProducts.map((product) => product.id);
    setSelectedProductIds((current) => ids.every((id) => current.includes(id)) ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };
  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`${API}/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts((current) => current.filter((product) => product.id !== id));
        setSelectedProductIds((current) => current.filter((item) => item !== id));
        window.dispatchEvent(new CustomEvent('data_changed'));
      } else {
        const errData = await response.json().catch(() => null);
        alert(errData?.error || 'Cannot delete this product because it has associated sales or purchase records. You can deactivate it instead.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server.');
    }
    setOpenProductAction(null);
  };
  const toggleProductStatus = async (product) => {
    const status = product.status === 'active' ? 'inactive' : 'active';
    const response = await fetch(`${API}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (response.ok) setProducts((current) => current.map((item) => item.id === product.id ? { ...item, status } : item));
    setOpenProductAction(null);
  };

  const previewBrand = brands.find((item) => String(item.id) === String(selectedBrand))?.name || '';
  const previewModel = models.find((item) => String(item.id) === String(selectedModel))?.name || '';
  const previewSeries = series.find((item) => String(item.id) === String(selectedSeries))?.name || '';
  const livePreviewParts = [previewBrand, form.name?.trim(), previewModel, previewSeries].filter(Boolean);
  const livePreviewTitle = livePreviewParts.join(' ');

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategory(value);
    setSelectedSubCategory('');
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedSeries('');
    setForm((current) => ({ ...current, category_id: value, sub_category_id: '', brand_id: '', model_id: '', series_id: '', name: '' }));
  };

  const handleSubCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedSubCategory(value);
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedSeries('');
    setForm((current) => ({ ...current, sub_category_id: value, brand_id: '', model_id: '', series_id: '', name: '' }));
  };

  const handleBrandChange = (event) => {
    const value = event.target.value;
    setSelectedBrand(value);
    setSelectedModel('');
    setSelectedSeries('');
    setForm((current) => ({ ...current, brand_id: value, model_id: '', series_id: '', name: '' }));
  };

  const handleProductNameChange = (event) => {
    const value = event.target.value;
    setSelectedModel('');
    setSelectedSeries('');
    setForm((current) => ({ ...current, name: value, model_id: '', series_id: '' }));
  };

  const handleModelChange = (event) => {
    const value = event.target.value;
    setSelectedModel(value);
    setSelectedSeries('');
    setForm((current) => ({ ...current, model_id: value, series_id: '' }));
  };

  const handleSeriesChange = (event) => {
    const value = event.target.value;
    setSelectedSeries(value);
    setForm((current) => ({ ...current, series_id: value }));
  };

  // Strict Full-Screen Login Gate: If no user is authenticated, render ONLY the dedicated Login Page
  if (!currentUser) {
    return (
      <LoginModal
        isOpen={true}
        canClose={false}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="app-frame" style={{ minHeight: '100vh', background: '#f8fafc', boxSizing: 'border-box' }}>
      <style>{`
        .page-shell { padding: 30px; max-width: 1400px; margin: 0 auto; }
        .app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .app-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        .global-quick-access { display: flex; align-items: center; gap: 18px; margin: 0 0 24px; padding: 16px 18px; border-radius: 14px; color: #eff6ff; background: linear-gradient(115deg, #0f172a 0%, #075985 56%, #0284c7 100%); box-shadow: 0 10px 24px rgba(3, 105, 161, 0.18); }
        .quick-access-copy { min-width: 170px; }
        .quick-access-copy p { margin: 0 0 4px; color: #bae6fd; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .quick-access-copy h2 { margin: 0; font-size: 1rem; color: #fff; }
        .quick-access-actions { display: flex; align-items: center; gap: 9px; flex: 1; flex-wrap: wrap; }
        .quick-access-button { display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 9px; padding: 9px 12px; color: #f8fafc; background: rgba(255, 255, 255, 0.1); font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease; }
        .quick-access-button:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
        .quick-access-button.emphasis { border-color: #fef3c7; color: #713f12; background: #fef3c7; }
        .quick-access-button.emphasis:hover { background: #fde68a; }
        @media (max-width: 760px) { .global-quick-access { align-items: flex-start; flex-direction: column; gap: 12px; } .quick-access-copy { min-width: 0; } .quick-access-actions { width: 100%; } .quick-access-button { flex: 1 1 calc(50% - 9px); justify-content: center; } }
        
        .tab-button { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 6px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .tab-button.active { background: #0284c7; color: #fff; }
        
        button.primary { background: #0284c7; color: #fff; border: none; padding: 9px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        button.primary:hover { background: #0369a1; }
        button.secondary { background: #e2e8f0; color: #334155; border: none; padding: 9px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        
        .catalog-summary { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .catalog-summary .eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #0284c7; font-weight: 700; margin: 0 0 4px 0; }
        .catalog-summary h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .catalog-summary p { font-size: 0.88rem; color: #64748b; margin: 0; }
        
        .summary-stats { display: flex; gap: 20px; }
        .summary-stats span { display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .summary-stats strong { font-size: 1.25rem; color: #0f172a; }
        .summary-stats small { font-size: 0.75rem; color: #64748b; }
        
        .catalog-list-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: visible; }
        .catalog-row { display: grid; grid-template-columns: 50px 60px 2fr 1fr 1fr 1fr 1fr 60px; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #334155; }
        .catalog-title-row { background: #f8fafc; font-weight: 600; color: #475569; }
        .catalog-image img { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
        .catalog-action { position: relative; display: flex; justify-content: center; }
        .catalog-action-menu { position: absolute; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1); z-index: 100; display: flex; flex-direction: column; min-width: 140px; overflow: hidden; }
        .catalog-action-menu button { background: none; border: none; padding: 10px 14px; text-align: left; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: #334155; display: flex; align-items: center; gap: 8px; transition: background 0.15s; }
        .catalog-action-menu button:hover { background: #f1f5f9; color: #0284c7; }
        
        .catalog-pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
        
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .modal-card { background: #fff; width: 100%; max-width: 750px; border-radius: 14px; padding: 24px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
        .modal-heading h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }
        .close-button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-size: 1.15rem;
          font-weight: bold;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }
        .close-button:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #ef4444;
          transform: rotate(90deg) scale(1.06);
        }
        .close-button:active {
          transform: scale(0.92);
        }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .popup-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #334155; }
        .popup-field input, .popup-field select, .popup-field textarea { width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; outline: none; box-sizing: border-box; }
        .popup-field input:focus, .popup-field select:focus, .popup-field textarea:focus { border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2,132,199,0.15); }
        .master-select-field { position: relative; }
        .master-select-row { display: grid; grid-template-columns: minmax(0, 1fr) 38px; gap: 8px; align-items: center; }
        .master-add-button { width: 38px; height: 38px; border: 1px solid #7dd3fc; border-radius: 7px; color: #0369a1; background: #f0f9ff; font-size: 1.25rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; font-weight: bold; }
        .master-add-button:hover:not(:disabled) { color: #fff; background: #0284c7; border-color: #0284c7; }
        .master-add-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .full-width { grid-column: span 2; }
        
        /* Simple Single-Line Live Preview Box */
        .product-live-line-box {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          padding: 10px 16px;
          margin-bottom: 20px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .product-live-line-box.active {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #15803d;
        }

        /* Unified Quick-Add Dialog */
        .quick-add-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10050;
          padding: 20px;
        }
        .quick-add-dialog {
          background: #ffffff;
          width: 100%;
          max-width: 440px;
          border-radius: 14px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .quick-add-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .quick-add-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .quick-add-header p {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: #64748b;
        }
        .quick-add-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .quick-add-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .btn-dummy-data {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-dummy-data:hover {
          background: #d1fae5;
          transform: translateY(-1px);
        }
        .btn-delete-row {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 5px 9px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-delete-row:hover {
          background: #fee2e2;
        }

        .image-picker-row { display: flex; align-items: center; gap: 14px; margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .image-preview { width: 45px; height: 45px; background: #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        
        .action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          flex-wrap: wrap;
        }
        .action-buttons-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-clear-form {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-clear-form:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #dc2626;
        }
        .btn-clear-form:active {
          transform: scale(0.97);
        }
        .form-error { color: #dc2626; font-size: 0.85rem; margin-right: auto; }
        .save-success { background: #dcfce7; color: #166534; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; font-size: 0.9rem; }
        
        .attributes-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        .attribute-panel { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-top: 4px solid var(--attribute-accent, #0284c7); display: flex; flex-direction: column; gap: 14px; }
        .attribute-panel-heading { display: flex; justify-content: space-between; align-items: flex-start; }
        .attribute-panel-heading h3 { margin: 0 0 4px 0; font-size: 1.05rem; color: #0f172a; }
        .attribute-panel-heading p { margin: 0; font-size: 0.8rem; color: #64748b; }
        .attribute-items { display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; }
        .attribute-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 0.88rem; }
        .attribute-item-actions { display: flex; gap: 8px; }
        .attribute-item-actions button { background: none; border: none; color: #0284c7; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
        .attribute-add { background: #f1f5f9; border: 1px dashed #cbd5e1; color: #0284c7; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%; text-align: center; }
        .attribute-add:hover { background: #e2e8f0; }

        @media (max-width: 768px) {
          .mobile-emergency-bar {
            display: flex !important;
            position: sticky;
            top: 0;
            z-index: 999;
            background: #0f172a;
            padding: 8px 12px;
            gap: 8px;
            overflow-x: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .mobile-emergency-btn {
            flex: 1;
            min-width: 84px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 8px 10px;
            font-size: 0.78rem;
            font-weight: 700;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            white-space: nowrap;
          }
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            z-index: 9999;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
            justify-content: space-around;
            align-items: center;
            padding: 0 4px;
          }
          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.1rem;
            cursor: pointer;
            flex: 1;
            padding: 6px 0;
          }
          .mobile-nav-item small {
            font-size: 0.68rem;
            font-weight: 600;
          }
          .mobile-nav-item.active {
            color: #10b981;
          }
          .page-shell {
            padding-bottom: 70px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-emergency-bar, .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>

      <div className="page-shell">
        <TopWelcomeBar 
          shopName={shopInfo.shop_name || 'Sheba Technology & Networking'} 
          userName={currentUser?.name || 'Super Admin'} 
          branchName={shopInfo.branch_name || 'Head Office - Dhaka'}
          onQuickSale={() => handleGlobalNavigate({ section: 'sales' })}
          onQuickPurchase={() => setIsPurchaseOpen(true)}
          onQuickAddProduct={openAddProduct}
          onQuickExpense={() => handleGlobalNavigate({ section: 'expenses' })}
          onQuickWarranty={() => handleGlobalNavigate({ section: 'warranty' })}
          onLogout={handleLogout}
          onNavigate={handleGlobalNavigate}
        />

        {/* Mobile Emergency Quick Actions Toolbar */}
        <div className="mobile-emergency-bar">
          <button
            type="button"
            className="mobile-emergency-btn"
            style={{ background: '#10b981', color: '#ffffff' }}
            onClick={() => handleGlobalNavigate({ section: 'sales' })}
            title="Emergency Quick Sale"
          >
            ⚡ সেল
          </button>
          <button
            type="button"
            className="mobile-emergency-btn"
            style={{ background: '#0284c7', color: '#ffffff' }}
            onClick={() => setIsPurchaseOpen(true)}
            title="Emergency Purchase"
          >
            📦 পারচেজ
          </button>
          <button
            type="button"
            className="mobile-emergency-btn"
            style={{ background: '#8b5cf6', color: '#ffffff' }}
            onClick={openAddProduct}
            title="Quick Add Product"
          >
            ➕ পণ্য যোগ
          </button>
          <button
            type="button"
            className="mobile-emergency-btn"
            style={{ background: '#334155', color: '#ffffff' }}
            onClick={() => handleGlobalNavigate({ section: 'inventory' })}
            title="Inventory & Stock"
          >
            🏬 স্টক
          </button>
        </div>

        {section === 'products' && (
          <header className="app-header">
            <h1>{sectionTitle}</h1>
            <div className="header-actions">
              <button type="button" className={`tab-button ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Product Catalog</button>
              <button type="button" className={`tab-button ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>Categories & Attributes</button>
              <button type="button" className="primary" onClick={openAddProduct}>+ Add Product</button>
            </div>
          </header>
        )}

        {isPurchaseOpen && (
          <PurchaseOrderModal
            products={products}
            onClose={() => setIsPurchaseOpen(false)}
            onSaved={async () => {
              await reloadProducts();
              setIsPurchaseOpen(false);
              setSaveSuccess('Purchase order saved successfully.');
            }}
          />
        )}

        {duplicatePopupMessage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '460px',
                width: '100%',
                padding: '26px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                textAlign: 'center',
                border: '1px solid #fecaca',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#ef4444',
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                ⚠️
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Duplicate Product Catalog
              </h3>
              <p
                style={{
                  margin: '0 0 22px 0',
                  fontSize: '0.96rem',
                  color: '#b91c1c',
                  fontWeight: 700,
                  lineHeight: 1.5,
                  background: '#fef2f2',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                }}
              >
                {duplicatePopupMessage}
              </p>
              <button
                type="button"
                onClick={() => setDuplicatePopupMessage('')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                }}
              >
                OK · Add a new product for catalog
              </button>
            </div>
          </div>
        )}

        {isAddProductOpen && (
          <div className="modal-backdrop">
            <div className="modal-card add-product-modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
              <div className="modal-heading">
                <div>
                  <h2 id="add-product-title">{editingProductId ? 'Edit Product' : 'Add Product'}</h2>
                  <p className="modal-subtitle">
                    {editingProductId ? 'Update product details in catalog' : 'Fill in product details to add to catalog'}
                  </p>
                </div>
                <div className="modal-heading-actions">
                  <button type="button" className="close-button" onClick={() => setIsAddProductOpen(false)} aria-label="Close" title="Close">✕</button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="product-form">
                <div
                  className={`product-live-line-box ${livePreviewTitle ? 'active' : ''}`}
                  aria-live="polite"
                >
                  {livePreviewTitle}
                </div>

                <div className="grid-2">
                  <label className="popup-field master-select-field">
                    <span>Category <b style={{ color: '#dc2626' }}>*</b></span>
                    <div className="master-select-row">
                      <select value={selectedCategory} onChange={handleCategoryChange}>
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        onClick={() => openQuickAddModal('categories')}
                        title="Add new category"
                        aria-label="Add category"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field master-select-field">
                    <span>Sub-category <b style={{ color: '#dc2626' }}>*</b></span>
                    <div className="master-select-row">
                      <select
                        value={selectedSubCategory}
                        disabled={!selectedCategory}
                        onChange={handleSubCategoryChange}
                      >
                        <option value="">Select sub-category</option>
                        {catalogSubCategories.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        disabled={!selectedCategory}
                        onClick={() => openQuickAddModal('sub_categories')}
                        title={selectedCategory ? "Add new sub-category" : "Select category first"}
                        aria-label="Add sub-category"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field master-select-field">
                    <span>Brand <b style={{ color: '#dc2626' }}>*</b></span>
                    <div className="master-select-row">
                      <select
                        value={selectedBrand}
                        disabled={!selectedSubCategory}
                        onChange={handleBrandChange}
                      >
                        <option value="">{selectedSubCategory ? "Select brand" : "Select sub-category first"}</option>
                        {catalogBrands.map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        disabled={!selectedSubCategory}
                        onClick={() => openQuickAddModal('brands')}
                        title={selectedSubCategory ? "Add new brand" : "Select sub-category first"}
                        aria-label="Add brand"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field master-select-field">
                    <span>Product Name</span>
                    <div className="master-select-row">
                      <select
                        name="name"
                        value={form.name}
                        disabled={!selectedBrand}
                        onChange={handleProductNameChange}
                        required
                      >
                        <option value="">{selectedBrand ? "Select product name" : "Select brand first"}</option>
                        {form.name && !productNames.some((item) => item.name === form.name) && (
                          <option value={form.name}>{form.name}</option>
                        )}
                        {productNames.map((item) => (
                          <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        disabled={!selectedBrand}
                        onClick={() => openQuickAddModal('product_name')}
                        title={selectedBrand ? "Add new product name" : "Select brand first"}
                        aria-label="Add product name"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field master-select-field">
                    <span>Model <b style={{ color: '#dc2626' }}>*</b></span>
                    <div className="master-select-row">
                      <select
                        value={selectedModel}
                        disabled={!form.name}
                        onChange={handleModelChange}
                      >
                        <option value="">{form.name ? "Select model" : "Select product name first"}</option>
                        {selectedModel && !models.some((m) => String(m.id) === String(selectedModel)) && (
                          <option value={selectedModel}>Current Model</option>
                        )}
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        disabled={!form.name}
                        onClick={() => openQuickAddModal('models')}
                        title={form.name ? "Add new model" : "Select product name first"}
                        aria-label="Add model"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field master-select-field">
                    <span>Series <b style={{ color: '#dc2626' }}>*</b></span>
                    <div className="master-select-row">
                      <select
                        value={selectedSeries}
                        disabled={!selectedModel}
                        onChange={handleSeriesChange}
                      >
                        <option value="">{selectedModel ? "Select series" : "Select model first"}</option>
                        {selectedSeries && !series.some((s) => String(s.id) === String(selectedSeries)) && (
                          <option value={selectedSeries}>Current Series</option>
                        )}
                        {series.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="master-add-button"
                        disabled={!selectedModel}
                        onClick={() => openQuickAddModal('series')}
                        title={selectedModel ? "Add new series" : "Select model first"}
                        aria-label="Add series"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="popup-field">
                    <span>SKU (Auto Generated)</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        name="sku"
                        value={form.sku}
                        onChange={handleFieldChange}
                        placeholder="e.g. SKU-123456"
                        required
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, sku: generateAutoSku() }))}
                        title="Generate New SKU Code"
                        style={{
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        🎲
                      </button>
                    </div>
                  </label>

                  <label className="popup-field">
                    <span>Min Stock Alert (Low Stock Threshold) <b style={{ color: '#dc2626' }}>*</b></span>
                    <input
                      type="number"
                      name="min_stock"
                      value={form.min_stock}
                      onChange={handleFieldChange}
                      min="0"
                      required
                      placeholder="e.g. 5"
                    />
                  </label>

                  <label className="popup-field">
                    <span>Condition</span>
                    <select name="condition" value={form.condition} onChange={handleFieldChange}>
                      <option>New</option>
                      <option>Used</option>
                      <option>Refurbished</option>
                    </select>
                  </label>

                  <div className="popup-field full-width" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.88rem' }}>
                      📸 Feature Image (Inventory & Main Display)
                    </label>
                    <input
                      key={`feat-${fileInputKey}`}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(event) => setFeatureImageFile(event.target.files?.[0] || null)}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                    <small style={{ display: 'block', color: '#64748b', marginTop: '4px', fontSize: '0.78rem' }}>
                      💡 Format: JPG, PNG, or WebP | Max Size: 2MB | Recommended: 800×800px (1:1 square for POS & E-Commerce)
                    </small>
                    {(featureImagePreview || form.image_url) && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <img
                          src={featureImagePreview || (form.image_url.startsWith('http') ? form.image_url : `${API.replace('/api', '')}${form.image_url}`)}
                          alt="Feature Preview"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1.5px solid #10b981' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>Feature Image Uploaded</div>
                          <button
                            type="button"
                            onClick={() => {
                              setFeatureImageFile(null);
                              setFeatureImagePreview(null);
                              setForm((p) => ({ ...p, image_url: '' }));
                              setFileInputKey((k) => k + 1);
                            }}
                            style={{ marginTop: '4px', padding: '3px 8px', fontSize: '0.74rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ✕ Remove Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="popup-field full-width" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.88rem' }}>
                      🖼️ Gallery Images (E-Commerce Storefront)
                    </label>
                    <input
                      key={`gal-${fileInputKey}`}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      multiple
                      onChange={(event) => setGalleryImageFiles(Array.from(event.target.files || []))}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                    <small style={{ display: 'block', color: '#64748b', marginTop: '4px', fontSize: '0.78rem' }}>
                      💡 Upload multiple product angles for E-Commerce. Format: JPG, PNG, or WebP | Max 2MB each
                    </small>
                    {galleryImagePreviews.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {galleryImagePreviews.map((previewUrl, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '56px', height: '56px' }}>
                            <img
                              src={previewUrl}
                              alt={`Gallery ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryImageFiles((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              }}
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="full-width popup-field" style={{ gridColumn: 'span 2' }}>
                    <span>Description</span>
                    <textarea name="description" value={form.description} onChange={handleFieldChange} rows={3} placeholder="Product specifications, warranty details, etc." />
                  </label>
                </div>

                <div className="optional-fields" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[['tracks_serial', 'Serial / Barcode Tracked', 'Track serial or barcode during purchases and sales'], ['is_service', 'Service Item (No Inventory)', 'Stock is not tracked for services'], ['is_bundle', 'Box / Bundle Product', 'Multiple products packaged together as a bundle']].map(([name, title, hint]) => (
                    <label className="optional-row" key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <span><strong>{title}</strong><br /><small style={{ color: '#64748b' }}>{hint}</small></span>
                      <input type="checkbox" name={name} checked={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    </label>
                  ))}
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="btn-clear-form"
                    onClick={handleResetForm}
                    title="Reset all form fields"
                  >
                    🧹 Clear Fields
                  </button>

                  <div className="action-buttons-right">
                    {saveError && <p className="form-error" style={{ margin: 0 }}>{saveError}</p>}
                    <button type="button" className="secondary" onClick={() => { setIsAddProductOpen(false); handleResetForm(); }}>Cancel</button>
                    <button type="submit" className="primary">{editingProductId ? 'Save Edit' : 'Add Product'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {quickAdd.isOpen && (
          <div className="quick-add-backdrop" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
            <div className="quick-add-dialog">
              <div className="quick-add-header">
                <div>
                  <h3 id="quick-add-title">{quickAdd.title}</h3>
                  <p>{quickAdd.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setQuickAdd((prev) => ({ ...prev, isOpen: false }))}
                  aria-label="Close"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleQuickAddSave}>
                <div className="quick-add-body">
                  {quickAdd.extraInfo && (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#b45309', background: '#fef3c7', padding: '8px 12px', borderRadius: '6px' }}>
                      {quickAdd.extraInfo}
                    </p>
                  )}
                  <label className="popup-field">
                    <span>{quickAdd.label}</span>
                    <input
                      autoFocus
                      type="text"
                      value={quickAdd.value}
                      onChange={(e) => setQuickAdd((prev) => ({ ...prev, value: e.target.value, error: '' }))}
                      placeholder={quickAdd.placeholder}
                      disabled={quickAdd.loading}
                      required
                    />
                  </label>
                  {quickAdd.error && (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px' }}>
                      ⚠️ {quickAdd.error}
                    </p>
                  )}
                </div>
                <div className="quick-add-footer">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setQuickAdd((prev) => ({ ...prev, isOpen: false }))}
                    disabled={quickAdd.loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={quickAdd.loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {quickAdd.loading ? 'Saving...' : '✓ Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {quickEdit.isOpen && (
          <div className="quick-add-backdrop" role="dialog" aria-modal="true" aria-labelledby="quick-edit-title">
            <div className="quick-add-dialog">
              <div className="quick-add-header">
                <div>
                  <h3 id="quick-edit-title">{quickEdit.title}</h3>
                  <p>{quickEdit.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="close-button"
                  onClick={() => setQuickEdit((prev) => ({ ...prev, isOpen: false }))}
                  aria-label="Close"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleQuickEditSave}>
                <div className="quick-add-body">
                  <label className="popup-field">
                    <span>{quickEdit.label}</span>
                    <input
                      autoFocus
                      type="text"
                      value={quickEdit.value}
                      onChange={(e) => setQuickEdit((prev) => ({ ...prev, value: e.target.value, error: '' }))}
                      disabled={quickEdit.loading}
                      required
                    />
                  </label>
                  {quickEdit.error && (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px' }}>
                      ⚠️ {quickEdit.error}
                    </p>
                  )}
                </div>
                <div className="quick-add-footer">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setQuickEdit((prev) => ({ ...prev, isOpen: false }))}
                    disabled={quickEdit.loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={quickEdit.loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {quickEdit.loading ? 'Saving...' : '✓ Save Edit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Suspense fallback={<PageFallback />}>
          {section === 'dashboard' ? (
            <Dashboard />
        ) : section === 'accounts' ? (
          <Accounts onNavigateToExpenses={() => setSection('expenses')} />
        ) : section === 'expenses' ? (
          <Expenses />
        ) : section === 'sales' ? (
          <Sales
            initialTab={globalNav.section === 'sales' ? (globalNav.tab || 'history') : 'history'}
            initialSearch={globalNav.section === 'sales' ? (globalNav.search || '') : ''}
            navKey={globalNav.key}
          />
        ) : section === 'purchases' ? (
          <Purchases
            initialTab={globalNav.section === 'purchases' ? (globalNav.tab || 'history') : 'history'}
            initialSearch={globalNav.section === 'purchases' ? (globalNav.search || '') : ''}
            navKey={globalNav.key}
            onOpenAddProduct={() => {
              setSection('products');
              setActiveTab('catalog');
              handleResetForm();
              setIsAddProductOpen(true);
            }}
          />
        ) : section === 'inventory' ? (
          <Inventory
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
          <Projects />
        ) : section === 'ecommerce' ? (
          <Ecommerce />
        ) : section === 'soc' ? (
          <Security />
        ) : section === 'warranty' ? (
          <Warranty />
        ) : section === 'trash' ? (
          <Trash />
        ) : section === 'settings' ? (
          <Settings onLogout={handleLogout} currentUser={currentUser} />
        ) : section === 'reports' ? (
          <Reports />
        ) : activeTab === 'catalog' ? (
          <div className="catalog-page">

            {saveSuccess && <p className="save-success">{saveSuccess}</p>}
            <section className="catalog-summary">
              <div>
                <p className="eyebrow">Inventory overview</p>
                <h2>Product Catalog</h2>
                <p>View all products, stock levels, and status at a glance.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="summary-stats">
                  <span><strong>{products.length}</strong><small>Total products</small></span>
                  <span><strong>{products.filter((product) => product.status === 'active').length}</strong><small>Active</small></span>
                  <span><strong>{products.filter((product) => product.stock <= product.min_stock).length}</strong><small>Low stock</small></span>
                </div>
              </div>
            </section>
            
            {productFilterQuery && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
                padding: '10px 16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}>
                <span>🔍 Filtered by Global Search: <strong>"{productFilterQuery}"</strong> ({filteredProducts.length} matches)</span>
                <button
                  type="button"
                  onClick={() => setProductFilterQuery('')}
                  style={{
                    marginLeft: 'auto',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Clear Filter
                </button>
              </div>
            )}

            <section className="catalog-list-card">
              <div className="catalog-row catalog-title-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={visibleProducts.length > 0 && visibleProducts.every((product) => selectedProductIds.includes(product.id))} onChange={toggleAllProducts} /> Select all
                </label>
                <span>Image</span>
                <span>Product Details</span>
                <span>SKU</span>
                <span>Category</span>
                <span>Sub-category</span>
                <span>Stock / Min</span>
                <span>Action</span>
              </div>
              
              {visibleProducts.length > 0 ? (
                visibleProducts.map((product) => (
                  <div className="catalog-row" key={product.id}>
                    <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Select ${product.name}`} />
                    <div className="catalog-image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : '📷'}</div>
                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productLabel(product)}</strong>
                    <span>{product.sku || 'Auto'}</span>
                    <span>{product.category_name || '—'}</span>
                    <span>{product.sub_category_name || '—'}</span>
                    <span className={product.stock <= product.min_stock ? 'low-stock' : ''} style={{ fontWeight: 600, color: product.stock <= product.min_stock ? '#dc2626' : '#166534' }}>{product.stock} / {product.min_stock}</span>
                    <div className="catalog-action">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProductAction((current) => current === product.id ? null : product.id);
                        }}
                        style={{
                          background: openProductAction === product.id ? '#e2e8f0' : '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#475569',
                          transition: 'all 0.15s ease'
                        }}
                        title="Actions"
                        aria-label="Actions"
                      >
                        ⋯
                      </button>
                      {openProductAction === product.id && (
                        <div
                          className="catalog-action-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenProductAction(null);
                              handleEditProduct(product);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenProductAction(null);
                              if (window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenProductAction(null);
                              toggleProductStatus(product);
                            }}
                          >
                            {product.status === 'active' ? '⏸️ Inactive' : '▶️ Active'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  No products found. Click "+ Add Product" to get started.
                </div>
              )}

              <div className="catalog-pagination">
                <button type="button" className="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
                <span>Page {currentPage} of {totalProductPages}</span>
                <button type="button" className="primary" disabled={currentPage === totalProductPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
              </div>
            </section>
          </div>
        ) : activeTab === 'attributes' ? (
          <div className="attributes-page">
            <div className="attributes-intro" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#0284c7', fontWeight: 700, margin: '0 0 4px 0' }}>Master data</p>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Categories & Attributes</h2>
              </div>
              <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{categories.length + subCategories.length + brands.length + productNames.length + models.length + series.length} total</span>
            </div>

            <div className="attributes-card">
              {[
                ['categories', 'Categories', 'Product primary grouping', categories, '#d06b42'],
                ['sub_categories', 'Sub-categories', 'Category inner grouping', subCategories, '#3f8f82'],
                ['brands', 'Brands', 'Product manufacturer', brands, '#5779a7'],
                ['product_names', 'Product Names', 'Item types or base product names', productNames, '#059669'],
                ['models', 'Models', 'Brand product model', models, '#8a6bb1'],
                ['series', 'Series', 'Model family or collection', series, '#b27b45'],
              ].map(([entity, title, description, items, accent]) => (
                <section className="attribute-panel" key={entity} style={{ '--attribute-accent': accent }}>
                  <div className="attribute-panel-heading">
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                    <strong style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{items.length}</strong>
                  </div>
                  
                  <div className="attribute-items">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <div className="attribute-item" key={item.id}>
                          <span>{item.name}{entity === 'sub_categories' && item.category_id ? <small style={{ color: '#64748b' }}> ({categories.find((c) => c.id === item.category_id)?.name || ''})</small> : null}</span>
                          <div className="attribute-item-actions">
                            <button type="button" onClick={() => openQuickEditModal(entity, item)}>Edit</button>
                            <button type="button" onClick={() => deleteAttribute(entity, item)}>Delete</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>No items found</span>
                    )}
                  </div>

                  {(entity === 'categories' || entity === 'sub_categories') && showAttributeAdd[entity] ? (
                    <form className="attribute-add-form" onSubmit={(event) => { event.preventDefault(); saveAttributeItem(entity); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {entity === 'sub_categories' && (
                        <select
                          value={attributeDraft.sub_category_parent}
                          onChange={(event) => setAttributeDraft((prev) => ({ ...prev, sub_category_parent: event.target.value }))}
                          required
                          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      )}
                      <input
                        value={attributeDraft[entity]}
                        onChange={(event) => setAttributeDraft((prev) => ({ ...prev, [entity]: event.target.value }))}
                        placeholder={entity === 'categories' ? 'New category' : 'New sub-category'}
                        required
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="primary" style={{ flex: 1, padding: '6px' }}>Save</button>
                        <button type="button" className="secondary" onClick={() => { setShowAttributeAdd((prev) => ({ ...prev, [entity]: false })); setAttributeError(''); }} style={{ flex: 1, padding: '6px' }}>Cancel</button>
                      </div>
                      {attributeError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{attributeError}</p>}
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="attribute-add"
                      onClick={() => {
                        if (entity === 'categories' || entity === 'sub_categories') {
                          setAttributeError('');
                          setShowAttributeAdd((prev) => ({ ...prev, [entity]: true }));
                        } else {
                          openQuickAddModal(entity);
                        }
                      }}
                    >
                      + Add {title.slice(0, -1)}
                    </button>
                  )}
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="module-placeholder" style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>SEBA ERP</p>
            <h2 style={{ color: '#0f172a', margin: '10px 0' }}>{sectionTitle}</h2>
            <p style={{ color: '#64748b' }}>This module is under development. Navigate to other sections from the dock.</p>
          </div>
        )}
        </Suspense>

        {/* Mobile Bottom Navigation Bar (Phone/Tablet) */}
        <nav className="mobile-bottom-nav">
          <button
            type="button"
            className={`mobile-nav-item ${section === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleGlobalNavigate({ section: 'dashboard' })}
          >
            <span>📊</span>
            <small>Dashboard</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'sales' ? 'active' : ''}`}
            onClick={() => handleGlobalNavigate({ section: 'sales' })}
          >
            <span>🛍️</span>
            <small>Sales</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'purchases' ? 'active' : ''}`}
            onClick={() => handleGlobalNavigate({ section: 'purchases' })}
          >
            <span>📦</span>
            <small>Purchase</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'inventory' ? 'active' : ''}`}
            onClick={() => handleGlobalNavigate({ section: 'inventory' })}
          >
            <span>🏬</span>
            <small>Stock</small>
          </button>
          <button
            type="button"
            className={`mobile-nav-item ${section === 'settings' ? 'active' : ''}`}
            onClick={() => handleGlobalNavigate({ section: 'settings' })}
          >
            <span>⚙️</span>
            <small>Settings</small>
          </button>
        </nav>
      </div>

      {/* Right Side Hover Navigation Dock */}
      <RightHoverNav
        activeSlug={section}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === 'products') {
            setActiveTab('catalog');
          } else {
            setActiveTab('module');
          }
        }}
      />

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

      {/* Login / Authentication Gateway Modal */}
      <LoginModal
        isOpen={showLoginModal || !currentUser}
        onLoginSuccess={handleLoginSuccess}
        canClose={!!currentUser}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

export default App;
