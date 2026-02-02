// tailwind.config.js — Tailwind + NativeWind; MyIO design tokens.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#ddf247',
        black: '#20272b',
        gray: '#545d63',
        white: '#ffffff',
      },
    },
  },
  plugins: [],
};
