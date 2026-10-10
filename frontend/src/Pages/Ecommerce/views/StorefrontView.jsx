import React from 'react';
import StorefrontTrustStrip from './storefront/StorefrontTrustStrip';
import StorefrontHeroBanner from './storefront/StorefrontHeroBanner';
import StorefrontCategoryPills from './storefront/StorefrontCategoryPills';
import StorefrontProductCard from './storefront/StorefrontProductCard';

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
  return (
    <div className="space-y-6 pb-8">
      {/* 1. Value Proposition & Trust Guarantee Strip */}
      <StorefrontTrustStrip />

      {/* 2. Hero Promotional Banner */}
      <StorefrontHeroBanner setActiveView={setActiveView} />

      {/* 3. Category Filter Pills */}
      <StorefrontCategoryPills
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

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
            const inCart = cart.find((it) => it.product_id === p.id);
            return (
              <StorefrontProductCard
                key={p.id}
                product={p}
                inCart={inCart}
                addToCart={addToCart}
                buyNow={buyNow}
                updateCartQty={updateCartQty}
                taka={taka}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
