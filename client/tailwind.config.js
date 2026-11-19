/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#F4F7F5',
          100: '#E6EDE8',
          200: '#C9D8CE',
          300: '#A6BEAF',
          400: '#7E9F8B',
          500: '#5B806B', // User exact: Sage Green #5B806B
          600: '#4D6D5B',
          700: '#3D5648',
          800: '#2F4238',
          900: '#223029',
        },
        taupe: {
          50: '#FAF7F4',
          100: '#F2ECE4',
          200: '#E4D7C8',
          300: '#D5C0AB',
          400: '#C5A98D', // User exact: Warm Taupe #C5A98D
          500: '#B09071',
          600: '#947558',
          700: '#765C44',
          800: '#5A4633',
        },
        sand: {
          50: '#FAF8F4',
          100: '#F5F0E6',
          200: '#E8DCC7', // User exact: Sand Beige #E8DCC7
          300: '#DDD0B7',
          400: '#CBBBA0',
          500: '#B5A285',
        },
        ivory: '#F5F4EF', // User exact: Warm Ivory #F5F4EF
        navy: {
          DEFAULT: '#243044', // User exact: Deep Navy #243044
          800: '#1D2737',
          900: '#243044',
          950: '#151C28',
        },
      },
    },
  },
  plugins: [],
};
