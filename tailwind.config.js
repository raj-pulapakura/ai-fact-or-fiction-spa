/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        "primary": "#5500FF",
        "accent": "#FFB1FE",
        "background": "#FFE2FF",
      },
      keyframes: {
        slideInFirst: {
          from: { height: "0px" },
          to: { height: "200px" },
        },
        slideInSecond: {
          from: { height: "0px" },
          to: { height: "150px" },
        },
        slideInThird: {
          from: { height: "0px" },
          to: { height: "100px"
          },
        },
        stretchOut: {
          from: { width: "0px" },
          to: { width: "100%" },
        }
      },
      animation: {
        slideInFirst: "slideInFirst 0.5s ease-in-out 9s forwards",
        slideInSecond: "slideInSecond 0.5s ease-in-out 7s forwards",
        slideInThird: "slideInThird 0.5s ease-in-out 5s forwards",
        stretchOut: "stretchOut 0.5s ease-in-out 11s forwards",
      },
    },

  },
  plugins: [
    require('tailwindcss-animated')
  ],
};
