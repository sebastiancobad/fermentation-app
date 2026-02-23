/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#F7F9F4',
          100: '#EEF2EA',
          200: '#D8DED4',
          300: '#B8C4B4',
          400: '#879186',
          500: '#6B7B6E',
          600: '#5B7F5C',
          700: '#4A6741',
          800: '#3D5A3E',
          900: '#1A2E1A',
        },
        mint: '#E6F7ED',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
