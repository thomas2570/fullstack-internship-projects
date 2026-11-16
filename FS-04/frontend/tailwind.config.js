/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        jira: {
          blue: '#0052CC',
          darkBlue: '#172B4D',
          navy: '#0747A6',
          subtle: '#F4F5F7',
          border: '#DFE1E6',
          text: '#172B4D',
          muted: '#6B778C',
        }
      },
    },
  },
  plugins: [],
}
