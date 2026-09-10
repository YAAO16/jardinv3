/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f8f2",
          100: "#e2efe2",
          200: "#c4dfc4",
          300: "#9bc89b",
          400: "#6aaa6a",
          500: "#4a8a4a",
          600: "#2d6a4f",
          700: "#1a4d2e",
          800: "#123822",
          900: "#0c2717",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}