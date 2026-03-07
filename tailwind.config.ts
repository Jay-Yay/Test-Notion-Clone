import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        notion: {
          bg: '#ffffff',
          'bg-dark': '#191919',
          sidebar: '#f7f6f3',
          'sidebar-dark': '#1f1f1f',
          hover: '#efefef',
          'hover-dark': '#2f2f2f',
          text: '#37352f',
          'text-dark': '#ffffffcf',
          muted: '#9b9a97',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
