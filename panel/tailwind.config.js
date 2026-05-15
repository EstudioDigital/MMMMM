/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg':        '#0f1117',
        'sidebar':       '#1a1d27',
        'card':          '#1e2030',
        'card-border':   '#2a2d3e',
        'accent':        '#25D366',
        'text-primary':  '#e2e8f0',
        'text-secondary':'#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        mateWalk: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-2deg)' },
          '50%':       { transform: 'translateY(-4px) rotate(2deg)' },
        },
      },
      animation: {
        'mate-walk': 'mateWalk 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
