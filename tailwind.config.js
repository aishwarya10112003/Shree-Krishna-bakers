/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        delafield: ['"Mrs Saint Delafield"', "cursive"], // Creates utility: font-delafield
        passions: ['"Passions Conflict"', "cursive"],
        unna: ['"Unna"', "serif"],

      },
    },
  },
  plugins: [],
};
