/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
