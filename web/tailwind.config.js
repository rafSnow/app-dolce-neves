/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dolce: {
          rosa: "#C96B7A",
          creme: "#F7F0E8",
          marrom: "#3D2314",
          "rosa-claro": "#FAE8EC",
        },
      },
    },
  },
  plugins: [],
}
