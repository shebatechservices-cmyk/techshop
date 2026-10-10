import React from 'react';

export default function StorefrontCategoryPills({
  categories = [],
  selectedCategory = 'all',
  setSelectedCategory,
}) {
  if (!categories.length || !setSelectedCategory) return null;

  return (
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
  );
}
