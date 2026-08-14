/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./site/**/*.html'],
  theme: {
    extend: {
      colors: {
        navy: '#040F3F',
        'navy-deep': '#020A2A',
        'blue-corp': '#0B2572',
        'blue-royal': '#2071D5',
        'cyan-light': '#53CDFE',
        gold: '#D4A23D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
