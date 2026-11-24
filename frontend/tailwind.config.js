/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1020',
        surface: '#0F162E',
        indigo: {
          50: '#EEF1FF',
          100: '#E0E4FF',
          400: '#7C8BFF',
          500: '#5B6EF5',
          600: '#4453DE',
          700: '#3540B3',
        },
        violet: {
          400: '#B389F9',
          500: '#9A5CF7',
          600: '#7C3AED',
        },
        mint: {
          400: '#4ADE9C',
          500: '#22C58F',
        },
        amber: {
          400: '#FBBF5C',
          500: '#F59E0B',
        },
        coral: {
          400: '#FF7A7A',
          500: '#F14C4C',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        glow: '0 0 40px rgba(124, 139, 255, 0.35)',
      },
      backgroundImage: {
        'grid-glow': 'radial-gradient(circle at 20% 20%, rgba(124,139,255,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(154,92,247,0.25), transparent 45%)',
      },
    },
  },
  plugins: [],
}
