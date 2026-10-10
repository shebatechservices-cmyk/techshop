import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSwitcherModal({ isOpen, onClose }) {
  const { theme, setTheme, themes } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">🎨</span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                Choose UI Theme (থিম নির্বাচন)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Personalize your workspace colors and appearance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Theme Options Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[70vh] overflow-y-auto">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Bar with Color Swatch & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full shadow-xs border border-white"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-xs border border-white -ml-2"
                        style={{ backgroundColor: t.secondaryHex }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
                    {t.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-snug">
                    {t.tagline}
                  </p>
                </div>

                {/* Bottom Selection Indicator */}
                <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
                    {isSelected ? '✓ Active Theme' : 'Click to Apply'}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isSelected ? t.primary : '#cbd5e1',
                      backgroundColor: isSelected ? t.primary : 'transparent',
                    }}
                  >
                    {isSelected && <span className="text-white text-[8px] leading-none">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Selected theme is auto-saved to your device.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
