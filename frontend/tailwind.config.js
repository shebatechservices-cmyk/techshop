/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/Pages/Accounts/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--theme-primary)',
          hover: 'var(--theme-primary-hover)',
          light: 'var(--theme-primary-light)',
          border: 'var(--theme-primary-border)',
          text: 'var(--theme-primary-text)',
        },
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          'border-strong': 'var(--theme-border-strong)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-text-muted)',
        },
      },
    },
  },
  plugins: [],
};
