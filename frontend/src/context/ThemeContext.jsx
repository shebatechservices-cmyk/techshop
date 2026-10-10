import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  {
    id: 'indigo',
    name: 'Indigo Executive',
    tagline: 'Modern Corporate & Enterprise ERP',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    badge: 'Popular',
    colorHex: '#4f46e5',
    secondaryHex: '#6366f1',
  },
  {
    id: 'emerald',
    name: 'Fintech Emerald',
    tagline: 'Retail POS, Invoicing & Financial Health',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    badge: 'Fintech',
    colorHex: '#059669',
    secondaryHex: '#10b981',
  },
  {
    id: 'sky',
    name: 'Sheba Classic Sky',
    tagline: 'Clean, High-Visibility Tech Blue',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#f0f9ff',
    badge: 'Classic',
    colorHex: '#0284c7',
    secondaryHex: '#38bdf8',
  },
  {
    id: 'dark',
    name: 'Midnight Slate',
    tagline: 'Eye-Friendly High Contrast Dark Mode',
    primary: '#38bdf8',
    primaryHover: '#0284c7',
    primaryLight: '#1e293b',
    badge: 'Dark Mode',
    colorHex: '#0f172a',
    secondaryHex: '#38bdf8',
    isDark: true,
  },
];

const THEME_STORAGE_KEY = 'sheba_theme_preference';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // fallback to indigo
    }
    return 'indigo';
  });

  const setTheme = (newTheme) => {
    if (!THEMES.some((t) => t.id === newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage may be disabled
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const currentThemeMeta = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeMeta,
        themes: THEMES,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
