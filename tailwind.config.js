/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      colors: {
        "primary": "#af25f4",
        "background-light": "#f7f5f8",
        "background-dark": "#1c1022",
      },
      fontFamily: {
        "display": ["Spline Sans"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}

