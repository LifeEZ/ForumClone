/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          bg: '#0e1612',
          surface: '#1a2820',
          'surface-hover': '#1e2f24',
          border: '#2a3d32',
          accent: '#4a9468',
          'accent-hover': '#3d7a56',
          text: '#ebe6dc',
          muted: '#9aab94',
          glow: '#d4a574',
        },
        vote: {
          up: '#d97736',
          down: '#6b8a9e',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
