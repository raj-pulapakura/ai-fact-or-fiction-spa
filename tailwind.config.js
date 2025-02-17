/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
          colors: {
      "primary": "#5500FF",
      "accent": "#FFB1FE",
      "background": "#FFE2FF",
    }
    },

  },
  plugins: [],
};
