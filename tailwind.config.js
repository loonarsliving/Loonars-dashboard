/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d4296c',
          dark: '#b81f58',
          light: '#e84d86',
        },
        loonars: {
          50: '#FDF5F8',
          100: '#F9E0EC',
          200: '#F3C0D8',
          800: '#2D1020',
          900: '#1a0912',
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
