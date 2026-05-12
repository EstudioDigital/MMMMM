/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0a',
          secondary: '#111111',
          card: '#161616',
        },
        accent: {
          green: '#25D366',
          dark: '#128C7E',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
      }
    },
  },
  plugins: [],
}
