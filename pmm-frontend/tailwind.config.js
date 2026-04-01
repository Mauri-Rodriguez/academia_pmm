/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'shinobi-dark': '#05070A',     // Negro profundo
        'shinobi-gold': '#D4AF37',     // Oro auténtico
        'shinobi-gold-light': '#F2D472',
      },
      fontFamily: {
        'scholar': ['"Cinzel"', 'serif'], // Para títulos épicos
        'modern': ['"Inter"', 'sans-serif'], // Para datos legibles
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}