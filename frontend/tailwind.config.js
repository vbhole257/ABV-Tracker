/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#090D16',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        fizz: {
          cyan: '#06B6D4',
          lime: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
