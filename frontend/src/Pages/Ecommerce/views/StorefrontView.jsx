import React, { useState } from 'react';

// Tech gadget SVG icon placeholder for products without images
function GadgetIconPlaceholder({ name = '', category = '' }) {
  const text = (name + ' ' + category).toLowerCase();
  let emoji = '📦';
  let label = 'TECH GEAR';

  if (text.includes('camera') || text.includes('cctv') || text.includes('ip') || text.includes('dahua') || text.includes('hikvision')) {
    emoji = '📹';
    label = 'CCTV CAMERA';
  } else if (text.includes('router') || text.includes('wifi') || text.includes('switch') || text.includes('onu') || text.includes('net')) {
    emoji = '🌐';
    label = 'NETWORKING';
  } else if (text.includes('cable') || text.includes('wire') || text.includes('patch')) {
    emoji = '🔌';
    label = 'CABLE & ACCESSORY';
  } else if (text.includes('power') || text.includes('adapter') || text.includes('supply') || text.includes('ups') || text.includes('battery')) {
    emoji = '⚡';
    label = 'POWER UNIT';
  } else if (text.includes('hdd') || text.includes('hard disk') || text.includes('memory') || text.includes('ssd')) {
    emoji = '💾';
    label = 'STORAGE';
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-4 select-none">
      <span className="text-4xl sm:text-5xl mb-2 drop-shadow-xs transition-transform group-hover:scale-110 duration-200">
        {emoji}
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}

export default function StorefrontView({
  filteredProducts = [],
  storeSearch = '',
  setStoreSearch,
  selectedCategory = 'all',
  setSelectedCategory,
  categories = [],
  sortBy = 'featured',
  setSortBy,
  cart = [],
  addToCart,
  buyNow,
  updateCartQty,
  setActiveView,
  taka,
}) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Value Proposition & Trust Guarantee Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
            🚚
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              সারা দেশে ডেলিভারি
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              ক্যাশ অন ডেলিভারি (Steadfast &amp; Pathao)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0">
            🛡️
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              ১০০% জেনুইন গ্যাজেট
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              ব্র্যান্ড ওয়ারেন্টি ও রিপ্লেসমেন্ট
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shrink-0">
            🔄
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              সহজ রিটার্ন ও সাপোর্ট
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              টেকনিক্যাল হেল্প ও কনফিগারেশন
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
            ⚡
          </span>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              ইনস্ট্যান্ট অর্ডার
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              লগইন ছাড়াই ১-ক্লিকে চেকআউট
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Promotional Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-6 opacity-10 text-8xl pointer-events-none hidden md:block">
          📹
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <span>✨</span>
            <span>Official Store &amp; Genuine Products</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug mb-2 text-white">
            অরিজিনাল সিসিটিভি ক্যামেরা, রাউটার ও সিকিউরিটি সল্যুশন
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
            সেরা পাইকারি ও খুচরা মূল্যে Dahua, Hikvision, TP-Link ও অন্যান্য ব্র্যান্ডের অফিসিয়াল পণ্য কিনুন। ৬৪ জেলায় ক্যাশ অন ডেলিভারি সুবিধা।
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('store-product-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>🛍️ পণ্যসমূহ দেখুন</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView && setActiveView('track')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>📦 পার্সেল ট্র্যাক করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      {categories.length > 0 && setSelectedCategory && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ক্যাটাগরি সমূহ (Categories)
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-brand font-bold hover:underline cursor-pointer"
              >
                সব দেখুন (View All)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              🌟 সব প্রোডাক্ট (All)
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Search & Sort Toolbar */}
      <div
        id="store-product-catalog"
        className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
      >
        <div className="relative w-full sm:flex-1 max-w-md">
          <input
            type="text"
            value={storeSearch}
            onChange={(e) => setStoreSearch && setStoreSearch(e.target.value)}
            placeholder="🔍 পণ্য খুঁজুন (নাম, ব্র্যান্ড বা মডেল)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 text-xs sm:text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
          {storeSearch && (
            <button
              type="button"
              onClick={() => setStoreSearch && setStoreSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            মোট <strong>{filteredProducts.length}</strong> টি পণ্য
          </span>

          {setSortBy && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold outline-none focus:border-brand cursor-pointer"
            >
              <option value="featured">✨ সাজানো: জনপ্রিয়</option>
              <option value="price-asc">💵 মূল্য: কম থেকে বেশি</option>
              <option value="price-desc">💎 মূল্য: বেশি থেকে কম</option>
              <option value="stock">📦 স্টক সংখ্যা অনুযায়ী</option>
            </select>
          )}
        </div>
      </div>

      {/* 5. Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center shadow-xs">
          <span className="text-5xl block mb-3">🔍</span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
            কোনো প্রোডাক্ট পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            আপনার অনুসন্ধানের সাথে মিলে এমন কোনো পণ্য স্টোরে পাওয়া যায়নি। সার্চ ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
          </p>
          {(storeSearch || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                if (setStoreSearch) setStoreSearch('');
                if (setSelectedCategory) setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90"
            >
              ফিল্টার রিসেট করুন (Show All)
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((p) => {
            const price = Number(p.selling_price || p.purchase_price || 0);
            const stock = Number(p.stock || 0);
            const inCart = cart.find((it) => it.product_id === p.id);
            const isOutOfStock = stock <= 0;
            const hasImage = p.image_url && !imageErrors[p.id];
            const brand = p.brand_name || p.brand;
            const category = p.category_name || p.category;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative"
              >
                <div>
                  {/* Media Wrapper */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-center p-2">
                    {hasImage ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        onError={() => handleImageError(p.id)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <GadgetIconPlaceholder name={p.name} category={category} />
                    )}

                    {/* Stock Pill Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${
                          isOutOfStock
                            ? 'bg-rose-500 text-white'
                            : stock <= 5
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'স্টক শেষ' : stock <= 5 ? `সীমিত স্টক (${stock})` : `ইন স্টক (${stock})`}
                      </span>

                      {brand && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                          {brand}
                        </span>
                      )}
                    </div>

                    {/* Warranty Badge if applicable */}
                    {p.warranty_period && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                          <span>🛡️</span>
                          <span>{p.warranty_period}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category & SKU */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider truncate max-w-[130px]">
                      {category || 'Electronics'}
                    </span>
                    <span className="font-mono text-[10px]">
                      SKU: {p.sku || 'AUTO'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3
                    className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 group-hover:text-brand transition-colors"
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                </div>

                {/* Pricing & Checkout Controls */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-2">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        অফার মূল্য
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        {taka(price)}
                      </span>
                    </div>

                    {/* Cash on delivery tag */}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                      ক্যাশ অন ডেলিভারি
                    </span>
                  </div>

                  {/* Cart Action Buttons */}
                  {inCart ? (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(p.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-sm flex items-center justify-center hover:bg-emerald-100 cursor-pointer shadow-xs transition-colors"
                        title="Reduce quantity"
                      >
                        −
                      </button>

                      <div className="text-center px-2">
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block leading-tight">
                          {inCart.quantity} টি কার্টে
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {taka(inCart.quantity * inCart.price)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateCartQty(p.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-sm flex items-center justify-center hover:bg-emerald-100 cursor-pointer shadow-xs transition-colors"
                        title="Add more"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(p, false)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
                        }`}
                        title="Add to cart"
                      >
                        <span>🛒</span>
                        <span>কার্ট</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => buyNow ? buyNow(p) : addToCart(p, true)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold text-white transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                        }`}
                        title="Instant Checkout"
                      >
                        <span>⚡</span>
                        <span>কিনুন</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
