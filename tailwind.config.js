/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // accent blue
        secondary: '#fb923c', // accent orange
        background: '#E0E5EC', // neumorphism base
        surface: '#E0E5EC', // same as background for unified look
        muted: '#94a3b8',
        ringTrack: '#e2e8f0',
        ringWork: '#2563eb',
        ringBreak: '#22c55e',
      },
      boxShadow: {
        'neumorph-sm': '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
        'neumorph-md': '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'neumorph-lg': '12px 12px 24px var(--shadow-dark), -12px -12px 24px var(--shadow-light)',
        'neumorph-inset': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
