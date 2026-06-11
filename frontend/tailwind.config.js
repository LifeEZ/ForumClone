/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          bg: '#0c1410',
          surface: '#13211a',
          'surface-hover': '#16261d',
          border: '#1f3329',
          accent: '#3a8a64',
          'accent-hover': '#2f6b4f',
          text: '#e6efe9',
          muted: '#8aa597',
        },
        vote: {
          up: '#d97736',
          down: '#5c7e9e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
