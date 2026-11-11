/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050506',
        carbon: '#0A0A0C',
        graphite: '#111113',
        steel: '#19191C',
        smoke: '#232327',
        titanium: '#8E8E93',
        mist: '#A1A1A6',
        silver: '#D9D6CF',
        pearl: '#F5F5F7',
        accent: {
          DEFAULT: '#C7A17A',
          light: '#E2C6A4',
          deep: '#9C7853',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        glass: '0 24px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        lift: '0 30px 90px -30px rgba(0,0,0,0.9)',
        glow: '0 0 80px -10px rgba(199,161,122,0.35)',
        'inner-line': 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'titanium-sheen':
          'linear-gradient(135deg, #1c1c1f 0%, #2a2926 22%, #17171a 48%, #262522 72%, #101012 100%)',
        'silver-sheen':
          'linear-gradient(135deg, #f7f6f3 0%, #dedad2 35%, #f1efea 58%, #cfcac0 100%)',
        'accent-sheen': 'linear-gradient(120deg, #E7CFAE 0%, #C7A17A 48%, #9C7853 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 5s ease-in-out infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
