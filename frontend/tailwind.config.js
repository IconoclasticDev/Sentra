/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#1c1f26',
          900: '#242833',
          700: '#3f4551',
          500: '#6b7280',
          400: '#8b93a1',
          200: '#dfe2e7',
          100: '#eceef2',
          50: '#f6f7f9',
        },
        accent: { DEFAULT: '#2f5f8f', soft: '#e9eff6', strong: '#1f4a73' },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Newsreader"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,31,38,0.05), 0 1px 3px rgba(28,31,38,0.04)',
        pop: '0 12px 40px rgba(28,31,38,0.14)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,.8,.36,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
