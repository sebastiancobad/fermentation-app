/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: forest green
        forest: {
          50:  '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4D3E',
          800: '#143D31',
          900: '#0D2818',
        },
        // Accent: amber/gold (fermentation evocation)
        amber: {
          50:  '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#E09F3E',
          600: '#D4A017',
          700: '#B8860B',
          800: '#986A06',
          900: '#6D4C00',
        },
        // Secondary: deep blue (data/charts)
        navy: {
          50:  '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#1B4965',
          600: '#163D55',
          700: '#0F2D40',
          800: '#0A1F2E',
          900: '#061420',
        },
        // Purple for organisms/yield
        plum: {
          50:  '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#7B2D8E',
          600: '#6A1B7A',
          700: '#4A148C',
          800: '#38006B',
          900: '#240047',
        },
        // Background layers
        warm: {
          white: '#FAFAF8',
          alt:   '#F0F4F1',
          card:  '#FFFFFF',
          code:  '#F8F6F0',
        },
        // Legacy sage (kept for transition)
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
      },
      fontFamily: {
        serif:  ['"Source Serif 4"', 'Georgia', 'serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        mono:   ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1':    ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2':    ['1.75rem', { lineHeight: '1.25', fontWeight: '600' }],
        'h3':    ['1.375rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body':  ['1rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
