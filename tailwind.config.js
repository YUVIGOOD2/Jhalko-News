/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Logo se liye gaye colors: Jhalko yellow + black + white
        brand: { DEFAULT: '#FFD900', dark: '#E6C200', light: '#FFF7CC', deep: '#8A6D00' },
        ink: '#0A0A0A',
        live: '#E11D2E',
      },
      fontFamily: {
        sans: ['Mukta', 'Inter', 'system-ui', 'sans-serif'],
        head: ['"Noto Serif Devanagari"', 'Georgia', 'serif'],
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: { ticker: 'ticker 40s linear infinite' },
    },
  },
  plugins: [],
};
